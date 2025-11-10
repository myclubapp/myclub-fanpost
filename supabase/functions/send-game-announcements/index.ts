import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const SPORT_API_URLS: Record<string, (teamId: string, clubId?: string) => string> = {
  unihockey: (teamId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey?query=%7B%0A%20%20games(teamId%3A%20%22${teamId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20result%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%7D%0A%7D%0A`,
  volleyball: (teamId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley?query=%7B%0A%20%20games(teamId%3A%20%22${teamId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20location%0A%20%20%20%20city%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%20%20result%0A%20%20%7D%0A%7D%0A`,
  handball: (teamId, clubId) => `https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball?query=%7B%0A%20%20games(teamId%3A%20%22${teamId}%22%2C%20clubId%3A%20%22${clubId}%22)%20%7B%0A%20%20%20%20id%0A%20%20%20%20teamHome%0A%20%20%20%20teamAway%0A%20%20%20%20date%0A%20%20%20%20time%0A%20%20%20%20result%0A%20%20%7D%0A%7D%0A`,
}

const GAME_RESULT_TEMPLATE_ID = '5cc48985-a846-4ef3-85e7-ede1ef834367'

interface TeamSlot {
  team_id: string
  team_name: string
  sport: string
  club_id: string
  user_email: string
}

interface Game {
  id: string
  date: string
  time: string
  home_team: string
  away_team: string
}

Deno.serve(async (req) => {
  try {
    console.log('Starting game announcements job...')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Alle User mit Team-Slots holen
    const { data: teamSlots, error: slotsError } = await supabase
      .from('user_team_slots')
      .select('team_id, team_name, sport, club_id, user_id')
    
    if (slotsError) {
      console.error('Error fetching team slots:', slotsError)
      throw slotsError
    }
    
    if (!teamSlots || teamSlots.length === 0) {
      console.log('No team slots found')
      return new Response(
        JSON.stringify({ success: true, message: 'No team slots to process' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Alle User-IDs sammeln und deren E-Mails + Einstellungen holen
    const userIds = [...new Set(teamSlots.map(slot => slot.user_id))]
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, email_game_announcement_reminder')
      .in('id', userIds)
      .eq('email_game_announcement_reminder', true) // Nur User, die Ankündigungen aktiviert haben
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw profilesError
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No users with game announcement reminders enabled')
      return new Response(
        JSON.stringify({ success: true, message: 'No users want game announcements' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // E-Mail-Mapping erstellen
    const emailMap = new Map(profiles.map(p => [p.id, p.email]))

    console.log(`Found ${teamSlots.length} team slots`)
    
    // Gruppiere Team-Slots nach User
    const userGames = new Map<string, { email: string; games: Array<Game & { sport: string; club_id: string; team_id: string }> }>()
    
    // Für jeden Team-Slot die Spiele in 3 Tagen abrufen
    for (const slot of teamSlots) {
      const userEmail = emailMap.get(slot.user_id)
      
      if (!userEmail) {
        console.log(`No email found for user ${slot.user_id}`)
        continue
      }
      
      if (!slot.sport || !SPORT_API_URLS[slot.sport]) {
        console.log(`Skipping slot with unknown sport: ${slot.sport}`)
        continue
      }
      
      try {
        console.log(`Fetching games for team ${slot.team_id} (${slot.sport})`)
        
        const apiUrl = SPORT_API_URLS[slot.sport](slot.team_id, slot.club_id)
        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          console.error(`API error for team ${slot.team_id}: ${response.status}`)
          continue
        }
        
        const result = await response.json()
        const games = result.data?.games || []
        
        // Filtere Spiele für in 3 Tagen
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(today)
        targetDate.setDate(targetDate.getDate() + 3)
        const dayAfterTarget = new Date(targetDate)
        dayAfterTarget.setDate(dayAfterTarget.getDate() + 1)
        
        const upcomingGames = games.filter((game: any) => {
          // Parse date format DD.MM.YYYY
          const [day, month, year] = game.date.split('.')
          const gameDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          gameDate.setHours(0, 0, 0, 0)
          return gameDate >= targetDate && gameDate < dayAfterTarget
        })
        
        if (upcomingGames.length > 0) {
          console.log(`Found ${upcomingGames.length} games in 3 days for team ${slot.team_id}`)
          
          if (!userGames.has(userEmail)) {
            userGames.set(userEmail, { email: userEmail, games: [] })
          }
          
          // Füge die Spiele zur User-Liste hinzu
          for (const game of upcomingGames) {
            userGames.get(userEmail)!.games.push({
              id: game.id,
              date: game.date,
              time: game.time,
              home_team: game.teamHome,
              away_team: game.teamAway,
              sport: slot.sport,
              club_id: slot.club_id,
              team_id: slot.team_id,
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching games for team ${slot.team_id}:`, error)
      }
    }
    
    console.log(`Sending emails to ${userGames.size} users`)
    
    // E-Mails versenden
    let sentCount = 0
    for (const [email, userData] of userGames.entries()) {
      if (userData.games.length === 0) continue
      
      // SMTP-Client für jede E-Mail neu erstellen
      const client = new SMTPClient({
        connection: {
          hostname: Deno.env.get('SMTP_HOST')!,
          port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
          tls: true,
          auth: {
            username: Deno.env.get('SMTP_USER')!,
            password: Deno.env.get('SMTP_PASS')!,
          },
        },
      })
      
      const gamesListHtml = userData.games.map(game => `
        <tr>
          <td bgcolor="#ffffff" align="left"
            style="padding: 15px 30px; border-bottom: 1px solid #f4f4f4; color: #111111; font-family: 'Maven Pro', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 22px;">
            <p style="margin: 0;">${game.home_team} vs ${game.away_team}</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 400; color: #666666;">
              ${game.date} um ${game.time}
            </p>
          </td>
        </tr>
        <tr>
          <td bgcolor="#ffffff" align="center" style="padding: 10px 30px 20px 30px;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 25px;" bgcolor="#015afe">
                  <a href="https://kanva.app/studio/${game.sport}/${game.club_id}/${game.team_id}/${game.id}?template=${GAME_RESULT_TEMPLATE_ID}" target="_blank"
                    style="font-size: 16px; font-family: 'Maven Pro', Arial, sans-serif; color: #FFFFFF; text-decoration: none; padding: 12px 20px; border-radius: 25px; border: 1px solid #015afe; display: inline-block;">
                    Ankündigung erstellen
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')
      
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Spielankündigung - KANVA</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Maven+Pro&family=Titillium+Web:wght@900&display=swap" rel="stylesheet">
    <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
        a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
        @media screen and (max-width:600px) { h1 { font-size: 32px !important; line-height: 32px !important; } }
        div[style*="margin: 16px 0;"] { margin: 0 !important; }
    </style>
</head>
<body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Maven Pro', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        In 3 Tagen ${userData.games.length === 1 ? 'steht ein Spiel' : 'stehen ' + userData.games.length + ' Spiele'} an!
    </div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <!-- LOGO -->
        <tr>
            <td bgcolor="#000000" align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 10px 40px 10px;">
                            <a href="https://kanva.app" target="_blank">
                                <img alt="Logo" src="https://kanva.app/logo_dark_wide.png" width="40" height="40"
                                    style="display: block; width: 200px; max-width: 200px; min-width: 40px; font-family: 'Maven Pro', Helvetica, Arial, sans-serif; color: #ffffff; font-size: 18px;" border="0">
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <!-- HERO -->
        <tr>
            <td bgcolor="#000000" align="center" style="padding: 0px 10px 0px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td bgcolor="#ffffff" align="center" valign="top"
                            style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Titillium Web', Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                            <h1 style="font-size: 48px; font-weight: 400; margin: 0;">Bald geht's los! 📅</h1>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <!-- COPY BLOCK -->
        <tr>
            <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td bgcolor="#ffffff" align="left"
                            style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Maven Pro', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;">
                                In 3 Tagen ${userData.games.length === 1 ? 'steht ein Spiel' : 'stehen ' + userData.games.length + ' Spiele'} deiner Teams an! Jetzt ist der perfekte Zeitpunkt, um eine mitreissende Spielankündigung zu erstellen und deine Fans zu mobilisieren.
                            </p>
                        </td>
                    </tr>
                    <!-- GAMES LIST -->
                    ${gamesListHtml}
                </table>
            </td>
        </tr>
        <!-- FOOTER -->
        <tr>
            <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td bgcolor="#f4f4f4" align="left"
                            style="padding: 30px 30px 30px 30px; color: #666666; font-family: 'Maven Pro', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;">
                            <p style="margin: 0 0 10px 0;">KANVA - wo Emotionen zu Stories werden.</p>
                            <p style="margin: 0; font-size: 12px; color: #999999;">
                                Du kannst deine E-Mail-Einstellungen jederzeit in deinem 
                                <a href="https://kanva.app/profile" style="color: #015afe; text-decoration: none;">Profil</a> anpassen.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
      `
      
      try {
        await client.send({
          from: 'KANVA <info@my-club.app>',
          to: email,
          subject: `📅 ${userData.games.length === 1 ? 'Dein Spiel' : userData.games.length + ' Spiele'} in 3 Tagen - Erstelle jetzt die Ankündigung!`,
          content: 'auto',
          html: emailHtml,
        })
        
        await client.close()
        
        sentCount++
        console.log(`Email sent to ${email}`)
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error)
        try {
          await client.close()
        } catch (closeError) {
          // Ignore close errors
        }
      }
    }
    
    console.log(`Job completed. Sent ${sentCount} emails.`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        usersWithGames: userGames.size,
        emailsSent: sentCount,
        message: `Sent ${sentCount} game announcement emails` 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error: any) {
    console.error('Error in send-game-announcements:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})