import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TeamSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TeamSlotDialog({
  open,
  onOpenChange,
  teamName,
  onConfirm,
  onCancel,
}: TeamSlotDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Team speichern?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du <strong>{teamName}</strong> in deinen Team-Slots speichern?
            <br /><br />
            Dies ermöglicht es dir, Grafiken für dieses Team zu exportieren. Das Team nimmt
            einen deiner verfügbaren Slots ein und kann nur 1x pro Woche gewechselt werden.
            <br /><br />
            <strong>Ja:</strong> Team speichern und Export durchführen<br />
            <strong>Nein:</strong> Export wird nicht durchgeführt
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Nein</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Ja, speichern</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
