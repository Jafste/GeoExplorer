using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiplayerRooms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "multiplayer_rooms",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    room_code = table.Column<string>(type: "text", nullable: false),
                    region = table.Column<string>(type: "text", nullable: false),
                    round_count = table.Column<int>(type: "integer", nullable: false),
                    timed = table.Column<bool>(type: "boolean", nullable: false),
                    round_time_seconds = table.Column<int>(type: "integer", nullable: true),
                    owner_player_id = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_multiplayer_rooms", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "multiplayer_players",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    room_id = table.Column<Guid>(type: "uuid", nullable: false),
                    player_id = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    is_owner = table.Column<bool>(type: "boolean", nullable: false),
                    connected = table.Column<bool>(type: "boolean", nullable: false),
                    total_score = table.Column<int>(type: "integer", nullable: false),
                    joined_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_seen_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_multiplayer_players", x => x.id);
                    table.ForeignKey(
                        name: "FK_multiplayer_players_multiplayer_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "multiplayer_rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "multiplayer_rounds",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    room_id = table.Column<Guid>(type: "uuid", nullable: false),
                    location_id = table.Column<string>(type: "text", nullable: false),
                    round_number = table.Column<int>(type: "integer", nullable: false),
                    visual_source = table.Column<string>(type: "jsonb", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    resolved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    resolution_reason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_multiplayer_rounds", x => x.id);
                    table.ForeignKey(
                        name: "FK_multiplayer_rounds_locations_location_id",
                        column: x => x.location_id,
                        principalTable: "locations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_multiplayer_rounds_multiplayer_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "multiplayer_rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "multiplayer_guesses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    round_id = table.Column<Guid>(type: "uuid", nullable: false),
                    player_id = table.Column<string>(type: "text", nullable: false),
                    guess_label = table.Column<string>(type: "text", nullable: true),
                    guess_latitude = table.Column<double>(type: "double precision", nullable: true),
                    guess_longitude = table.Column<double>(type: "double precision", nullable: true),
                    distance_km = table.Column<double>(type: "double precision", nullable: true),
                    score = table.Column<int>(type: "integer", nullable: false),
                    resolution_reason = table.Column<string>(type: "text", nullable: false),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_multiplayer_guesses", x => x.id);
                    table.ForeignKey(
                        name: "FK_multiplayer_guesses_multiplayer_rounds_round_id",
                        column: x => x.round_id,
                        principalTable: "multiplayer_rounds",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_multiplayer_guesses_round_id_player_id",
                table: "multiplayer_guesses",
                columns: new[] { "round_id", "player_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_multiplayer_players_room_id_display_name",
                table: "multiplayer_players",
                columns: new[] { "room_id", "display_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_multiplayer_players_room_id_player_id",
                table: "multiplayer_players",
                columns: new[] { "room_id", "player_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_multiplayer_rooms_room_code",
                table: "multiplayer_rooms",
                column: "room_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_multiplayer_rounds_location_id",
                table: "multiplayer_rounds",
                column: "location_id");

            migrationBuilder.CreateIndex(
                name: "IX_multiplayer_rounds_room_id_round_number",
                table: "multiplayer_rounds",
                columns: new[] { "room_id", "round_number" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "multiplayer_guesses");

            migrationBuilder.DropTable(
                name: "multiplayer_players");

            migrationBuilder.DropTable(
                name: "multiplayer_rounds");

            migrationBuilder.DropTable(
                name: "multiplayer_rooms");
        }
    }
}
