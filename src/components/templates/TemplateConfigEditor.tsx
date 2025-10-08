import { TemplateDesigner } from './TemplateDesigner';

interface TemplateConfigEditorProps {
  templateType: 'game-preview' | 'game-result';
  config: any;
  onChange: (config: any) => void;
}

export const TemplateConfigEditor = ({ templateType, config, onChange }: TemplateConfigEditorProps) => {
  return (
    <TemplateDesigner
      templateType={templateType}
      config={config}
      onChange={onChange}
    />
  );
};
