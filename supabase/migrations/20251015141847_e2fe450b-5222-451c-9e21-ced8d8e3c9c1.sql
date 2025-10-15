-- Enable custom templates for Amateur tier
UPDATE public.subscription_limits
SET can_use_custom_templates = true,
    max_custom_templates = 1
WHERE tier = 'amateur';