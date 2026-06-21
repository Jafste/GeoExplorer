import type { RefObject } from "react";
import { Clock3, LockKeyhole, RefreshCw, Search, UsersRound } from "lucide-react";
import { Card } from "../../components/layout/card/card";
import { AppNotice } from "../../components/ui/AppNotice";
import { ButtonBase, IconButton } from "../../components/ui/Button";
import { ModalDialog } from "../../components/ui/ModalDialog";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { RoundedButton } from "../../components/ui/roundedButton";
import { TextField } from "../../components/ui/TextField";
import type { MultiplayerOpenRoom } from "../../types/game";
import {
  formatOpenRoomPlayerCount,
  formatOpenRoomTimer,
} from "./multiplayerFormat";
import {
  MultiplayerDisplayNameField,
  type NameEditorProps,
} from "./MultiplayerNameEditor";

export function MultiplayerApiRequiredView() {
  return (
    <section className="screen-shell multiplayer-screen">
      <Card as="article" variant="tacticalStack">
        <span className="eyebrow">multiplayer</span>
        <h2 className="section-title">O multiplayer precisa do backend em modo api.</h2>
        <p>
          Para testar salas em tempo real, arranca o projeto com o perfil full ou com o frontend em
          modo api.
        </p>
      </Card>
    </section>
  );
}

interface MultiplayerEntryViewProps extends NameEditorProps {
  busy: boolean;
  entryInfo: string | null;
  error: string | null;
  filteredOpenRooms: MultiplayerOpenRoom[];
  hasMoreOpenRooms: boolean;
  hiddenOpenRoomCount: number;
  isPublicRoom: boolean;
  joinPassword: string;
  joinPasswordInputRef: RefObject<HTMLInputElement | null>;
  loadingOpenRooms: boolean;
  onCloseJoinOpenRoomModal: () => void;
  onConfirmJoinOpenRoom: () => void;
  onCreateRoom: () => void;
  onDismissEntryInfo: () => void;
  onDismissError: () => void;
  onDismissSelectedOpenRoomError: () => void;
  onJoinOpenRoom: (openRoom: MultiplayerOpenRoom) => void;
  onJoinRoom: () => void;
  onLoadMoreOpenRooms: () => void;
  onLoadOpenRooms: () => void;
  onOpenRoomSearchChange: (search: string) => void;
  onPublicRoomChange: (isPublic: boolean) => void;
  onRoomCodeInputChange: (roomCode: string) => void;
  onRoomPasswordChange: (password: string) => void;
  onSelectedOpenRoomPasswordChange: (password: string) => void;
  onJoinPasswordChange: (password: string) => void;
  openRoomSearch: string;
  openRoomsPageSize: number;
  openRooms: MultiplayerOpenRoom[];
  openRoomsLoaded: boolean;
  roomCodeInput: string;
  roomPassword: string;
  selectedOpenRoom: MultiplayerOpenRoom | null;
  selectedOpenRoomError: string | null;
  selectedOpenRoomPassword: string;
  visibleOpenRooms: MultiplayerOpenRoom[];
}

export function MultiplayerEntryView({
  busy,
  displayName,
  entryInfo,
  error,
  filteredOpenRooms,
  hasMoreOpenRooms,
  hiddenOpenRoomCount,
  isPublicRoom,
  joinPassword,
  joinPasswordInputRef,
  loadingOpenRooms,
  onCloseJoinOpenRoomModal,
  onConfirmJoinOpenRoom,
  onCreateRoom,
  onDismissEntryInfo,
  onDismissError,
  onDismissSelectedOpenRoomError,
  onDisplayNameChange,
  onJoinOpenRoom,
  onJoinPasswordChange,
  onJoinRoom,
  onLoadMoreOpenRooms,
  onLoadOpenRooms,
  onOpenRoomSearchChange,
  onPublicRoomChange,
  onRandomizeDisplayName,
  onRoomCodeInputChange,
  onRoomPasswordChange,
  onSelectedOpenRoomPasswordChange,
  openRoomSearch,
  openRoomsPageSize,
  openRooms,
  openRoomsLoaded,
  roomCodeInput,
  roomPassword,
  selectedOpenRoom,
  selectedOpenRoomError,
  selectedOpenRoomPassword,
  visibleOpenRooms,
}: MultiplayerEntryViewProps) {
  return (
    <section className="screen-shell multiplayer-screen">
      <div className="section-header section-header-inline">
        <div>
          <div className="eyebrow">multiplayer</div>
          <h2 className="section-title">Monta uma equipa ou entra por convite.</h2>
        </div>
      </div>

      {error ? (
        <AppNotice
          message={error}
          onDismiss={onDismissError}
          tone="danger"
        />
      ) : null}

      {entryInfo ? (
        <AppNotice
          message={entryInfo}
          onDismiss={onDismissEntryInfo}
          tone="info"
        />
      ) : null}

      <div className="multiplayer-entry-grid">
        <Card as="article" className="multiplayer-entry-card" variant="setupPanelStack">
          <div className="multiplayer-entry-card-header">
            <span className="muted-eyebrow">Sala</span>
          </div>
          <MultiplayerDisplayNameField
            busy={busy}
            displayName={displayName}
            label="Nome na sala"
            onChange={onDisplayNameChange}
            onRandomize={onRandomizeDisplayName}
            placeholder="Nome gerado automaticamente"
          />

          <SegmentedControl
            label="Visibilidade"
            options={[
              { label: "Por link", value: false },
              { label: "Sala aberta", value: true },
            ]}
            value={isPublicRoom}
            onChange={onPublicRoomChange}
          />

          <TextField
            autoComplete="new-password"
            className="multiplayer-field"
            label="Password opcional"
            maxLength={48}
            name="roomPassword"
            onChange={(event) => onRoomPasswordChange(event.target.value)}
            placeholder="Deixa em branco para acesso direto"
            type="password"
            value={roomPassword}
          />

          <RoundedButton
            className="multiplayer-entry-submit"
            disabled={busy}
            intent="primary"
            radius="none"
            onClick={onCreateRoom}
            type="button"
          >
            {busy ? "A criar…" : "Criar sala"}
          </RoundedButton>
        </Card>

        <Card as="article" className="multiplayer-entry-card" variant="setupPanelStack">
          <div className="multiplayer-entry-card-header">
            <span className="muted-eyebrow">Convite</span>
          </div>
          <h3>Entrar numa sala existente</h3>
          <p>Usa o código recebido por link. O nome tem de ser único dentro da sala.</p>
          <TextField
            autoComplete="off"
            className="multiplayer-field"
            label="Código da sala"
            maxLength={6}
            name="roomCode"
            onChange={(event) => onRoomCodeInputChange(event.target.value.toUpperCase())}
            placeholder="ABCD12"
            spellCheck={false}
            value={roomCodeInput}
          />
          <TextField
            ref={joinPasswordInputRef}
            autoComplete="current-password"
            className="multiplayer-field"
            label="Password, se existir"
            maxLength={48}
            name="joinPassword"
            onChange={(event) => onJoinPasswordChange(event.target.value)}
            placeholder="Opcional"
            type="password"
            value={joinPassword}
          />
          <RoundedButton
            className="multiplayer-entry-submit"
            disabled={busy}
            color="neon"
            radius="none"
            onClick={onJoinRoom}
            type="button"
          >
            {busy ? "A entrar…" : "Entrar na sala"}
          </RoundedButton>
        </Card>

        <Card as="article" variant="setupPanelStack" className="multiplayer-entry-card multiplayer-open-room-card">
          <div className="multiplayer-entry-card-header multiplayer-open-room-head">
            <div>
              <span className="muted-eyebrow">Salas abertas</span>
              <h3>Escolher sala aberta</h3>
            </div>
            <IconButton
              className={[
                "multiplayer-icon-button",
                "multiplayer-open-room-refresh",
                loadingOpenRooms ? "is-loading" : "",
              ].filter(Boolean).join(" ")}
              disabled={loadingOpenRooms}
              label="Atualizar salas abertas"
              onClick={onLoadOpenRooms}
              title="Atualizar salas abertas"
            >
              <RefreshCw size={18} strokeWidth={2.2} />
            </IconButton>
          </div>
          <p>Salas no lobby sincronizadas em tempo real.</p>
          <div className="multiplayer-open-room-summary" aria-live="polite">
            <span>
              <UsersRound size={16} strokeWidth={2.2} />
              {openRooms.length} sala{openRooms.length === 1 ? "" : "s"}
            </span>
            <span>
              <Clock3 size={16} strokeWidth={2.2} />
              {loadingOpenRooms ? "A sincronizar" : "Tempo real"}
            </span>
          </div>
          <TextField
            autoComplete="off"
            className="multiplayer-search-shell"
            label="Pesquisar salas abertas"
            leading={<Search size={17} strokeWidth={2.2} />}
            name="openRoomSearch"
            onChange={(event) => onOpenRoomSearchChange(event.target.value)}
            placeholder="Pesquisar por código, dono ou ritmo"
            srOnlyLabel
            value={openRoomSearch}
          />
          <div className="multiplayer-open-room-list" aria-busy={loadingOpenRooms} aria-live="polite">
            {openRooms.length === 0 ? (
              <span className="multiplayer-empty-state">
                {loadingOpenRooms
                  ? "A ligar à lista de salas abertas…"
                  : openRoomsLoaded
                    ? "Não há equipas abertas neste momento. Cria uma equipa aberta ou entra por link."
                    : "A preparar sincronização das salas abertas."}
              </span>
            ) : filteredOpenRooms.length === 0 ? (
              <span className="multiplayer-empty-state">
                Nenhuma sala aberta corresponde a "{openRoomSearch.trim()}".
              </span>
            ) : (
              <>
                <div className="multiplayer-open-room-table-head" aria-hidden="true">
                  <span>Sala</span>
                  <span>Dono</span>
                  <span>Jogadores</span>
                  <span>Rondas</span>
                  <span>Tempo</span>
                  <span />
                </div>
                {visibleOpenRooms.map((openRoom) => (
                  <ButtonBase
                    className="multiplayer-open-room"
                    disabled={busy || loadingOpenRooms}
                    key={openRoom.roomCode}
                    onClick={() => {
                      onJoinOpenRoom(openRoom);
                    }}
                  >
                    <span className="multiplayer-open-room-main">
                      <span className="multiplayer-open-room-code">Sala {openRoom.roomCode}</span>
                      {openRoom.hasPassword ? (
                        <span
                          className="multiplayer-open-room-protected"
                          aria-label="Sala protegida por password"
                          title="Protegida por password"
                        >
                          <LockKeyhole size={15} strokeWidth={2.2} />
                          Protegida
                        </span>
                      ) : null}
                    </span>
                    <span className="multiplayer-open-room-owner">Dono: {openRoom.ownerDisplayName}</span>
                    <span className="multiplayer-open-room-stat">
                      <UsersRound size={15} strokeWidth={2.2} />
                      {formatOpenRoomPlayerCount(openRoom.playerCount)}
                    </span>
                    <span className="multiplayer-open-room-stat">{openRoom.roundCount} rondas</span>
                    <span className="multiplayer-open-room-stat">
                      <Clock3 size={15} strokeWidth={2.2} />
                      {formatOpenRoomTimer(openRoom)}
                    </span>
                    <span className="multiplayer-open-room-action">Entrar</span>
                  </ButtonBase>
                ))}
                <div className="multiplayer-open-room-footer">
                  <span className="multiplayer-open-room-count">
                    A mostrar {visibleOpenRooms.length} de {filteredOpenRooms.length}
                    {openRoomSearch.trim() ? ` resultados` : ` salas`}
                  </span>
                  {hasMoreOpenRooms ? (
                    <RoundedButton
                      color="neon"
                      disabled={loadingOpenRooms}
                      radius="none"
                      size="sm"
                      tone="ghost"
                      type="button"
                      onClick={onLoadMoreOpenRooms}
                    >
                      Carregar mais {Math.min(hiddenOpenRoomCount, openRoomsPageSize)}
                    </RoundedButton>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {selectedOpenRoom ? (
        <ModalDialog
          title={`Entrar na sala ${selectedOpenRoom.roomCode}`}
          onClose={onCloseJoinOpenRoomModal}
          footer={
            <>
              <RoundedButton
                disabled={busy}
                color="neon"
                tone="ghost"
                radius="none"
                onClick={onCloseJoinOpenRoomModal}
                type="button"
              >
                Cancelar
              </RoundedButton>
              <RoundedButton
                disabled={busy}
                intent="primary"
                radius="none"
                onClick={onConfirmJoinOpenRoom}
                type="button"
              >
                {busy ? "A entrar…" : "Entrar"}
              </RoundedButton>
            </>
          }
        >
          {selectedOpenRoomError ? (
            <AppNotice
              message={selectedOpenRoomError}
              onDismiss={onDismissSelectedOpenRoomError}
              tone="danger"
            />
          ) : null}
          <div className="multiplayer-open-room-modal-summary">
            <span>
              <UsersRound size={16} strokeWidth={2.2} />
              {formatOpenRoomPlayerCount(selectedOpenRoom.playerCount)}
            </span>
            <span>{selectedOpenRoom.roundCount} rondas</span>
            <span>
              <Clock3 size={16} strokeWidth={2.2} />
              {formatOpenRoomTimer(selectedOpenRoom)}
            </span>
            {selectedOpenRoom.hasPassword ? (
              <span className="multiplayer-open-room-protected">
                <LockKeyhole size={16} strokeWidth={2.2} />
                Protegida
              </span>
            ) : null}
          </div>
          <p>
            {selectedOpenRoom.hasPassword ? "Esta sala aberta pede password. " : ""}
            Vais entrar como <strong>{displayName.trim() || "nome automático"}</strong> na sala de{" "}
            <strong>{selectedOpenRoom.ownerDisplayName}</strong>.
          </p>
          {selectedOpenRoom.hasPassword ? (
            <TextField
              autoComplete="current-password"
              className="multiplayer-field"
              label="Password da sala"
              maxLength={48}
              name="selectedOpenRoomPassword"
              onChange={(event) => onSelectedOpenRoomPasswordChange(event.target.value)}
              placeholder="Password definida pelo dono"
              type="password"
              value={selectedOpenRoomPassword}
            />
          ) : null}
        </ModalDialog>
      ) : null}
    </section>
  );
}
