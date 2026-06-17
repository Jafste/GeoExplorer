import { Shuffle } from "lucide-react";
import { IconButton } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";

export interface NameEditorProps {
  busy: boolean;
  displayName: string;
  onDisplayNameChange: (displayName: string) => void;
  onRandomizeDisplayName: () => void;
}

interface MultiplayerDisplayNameFieldProps {
  busy: boolean;
  displayName: string;
  label: string;
  onChange: (displayName: string) => void;
  onRandomize: () => void;
  placeholder?: string;
}

export function MultiplayerDisplayNameField({
  busy,
  displayName,
  label,
  onChange,
  onRandomize,
  placeholder,
}: MultiplayerDisplayNameFieldProps) {
  return (
    <TextField
      className="multiplayer-field"
      inputWrapperClassName="multiplayer-name-input-shell"
      label={label}
      maxLength={24}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      trailing={
        <IconButton
          className="multiplayer-name-random"
          disabled={busy}
          label="Gerar nome aleatório"
          onClick={onRandomize}
          title="Gerar nome aleatório"
        >
          <Shuffle size={17} strokeWidth={2.25} />
        </IconButton>
      }
      value={displayName}
    />
  );
}

export function NameEditor({
  busy,
  displayName,
  onDisplayNameChange,
  onRandomizeDisplayName,
}: NameEditorProps) {
  return (
    <div className="multiplayer-name-editor">
      <MultiplayerDisplayNameField
        busy={busy}
        displayName={displayName}
        label="O teu nome"
        onChange={onDisplayNameChange}
        onRandomize={onRandomizeDisplayName}
      />
    </div>
  );
}
