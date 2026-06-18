# Modelo de Dados PostgreSQL

O schema principal é criado pelas migrations do Entity Framework em `src/backend/Data/Migrations`.

```mermaid
erDiagram
    LOCATIONS ||--o{ SESSION_ROUNDS : "usado_em"
    GAME_SESSIONS ||--o{ SESSION_ROUNDS : "tem"
    LOCATIONS ||--o{ MULTIPLAYER_ROUNDS : "usado_em"
    MULTIPLAYER_ROOMS ||--o{ MULTIPLAYER_PLAYERS : "tem"
    MULTIPLAYER_ROOMS ||--o{ MULTIPLAYER_ROUNDS : "tem"
    MULTIPLAYER_ROUNDS ||--o{ MULTIPLAYER_GUESSES : "recebe"
    MULTIPLAYER_PLAYERS ||--o{ MULTIPLAYER_GUESSES : "submete"

    LOCATIONS {
        string id PK
        string title
        string city
        string country
        string region
        string category
        double latitude
        double longitude
        string scene_label
        string image_url
        string image_source_url
        string image_license
        jsonb visual_sources
        jsonb clues
    }

    GAME_SESSIONS {
        uuid id PK
        string region
        int round_count
        boolean timed
        int round_time_seconds
        int total_score
        string status
        datetime created_at
    }

    SESSION_ROUNDS {
        uuid id PK
        uuid session_id FK
        string location_id FK
        int round_number
        jsonb visual_source
        string status
        double guess_latitude
        double guess_longitude
        double distance_km
        int score
        datetime resolved_at
    }

    MULTIPLAYER_ROOMS {
        uuid id PK
        string room_code
        string region
        int round_count
        boolean timed
        string owner_player_id
        boolean is_public
        string password_hash
        string status
        datetime created_at
        datetime completed_at
    }

    MULTIPLAYER_PLAYERS {
        uuid id PK
        uuid room_id FK
        string player_id
        string display_name
        boolean is_owner
        boolean connected
        int total_score
        datetime joined_at
        datetime last_seen_at
    }

    MULTIPLAYER_ROUNDS {
        uuid id PK
        uuid room_id FK
        string location_id FK
        int round_number
        jsonb visual_source
        string status
        datetime started_at
        datetime ends_at
        datetime resolved_at
    }

    MULTIPLAYER_GUESSES {
        uuid id PK
        uuid round_id FK
        string player_id
        string guess_label
        double guess_latitude
        double guess_longitude
        double distance_km
        int score
        datetime submitted_at
    }
```

## Notas

- `locations` guarda o catálogo real e as fontes visuais disponíveis por local.
- `session_rounds.visual_source` e `multiplayer_rounds.visual_source` guardam a fonte escolhida para a ronda, para manter consistência quando a sessão é recuperada.
- `multiplayer_rooms.password_hash` guarda apenas o hash da password da sala, quando existe.
- `multiplayer_guesses.player_id` liga o palpite ao identificador lógico do jogador dentro da sala.
