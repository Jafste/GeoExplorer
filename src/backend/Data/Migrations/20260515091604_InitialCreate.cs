using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GeoExplorer.Backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "game_sessions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    region = table.Column<string>(type: "text", nullable: false),
                    round_count = table.Column<int>(type: "integer", nullable: false),
                    timed = table.Column<bool>(type: "boolean", nullable: false),
                    round_time_seconds = table.Column<int>(type: "integer", nullable: true),
                    total_score = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_game_sessions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "locations",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    city = table.Column<string>(type: "text", nullable: false),
                    country = table.Column<string>(type: "text", nullable: false),
                    region = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    latitude = table.Column<double>(type: "double precision", nullable: false),
                    longitude = table.Column<double>(type: "double precision", nullable: false),
                    scene_label = table.Column<string>(type: "text", nullable: false),
                    scene_note = table.Column<string>(type: "text", nullable: false),
                    scene_image = table.Column<string>(type: "text", nullable: true),
                    media_source_provider = table.Column<string>(type: "text", nullable: true),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    image_source_url = table.Column<string>(type: "text", nullable: true),
                    image_attribution = table.Column<string>(type: "text", nullable: true),
                    image_license = table.Column<string>(type: "text", nullable: true),
                    image_license_url = table.Column<string>(type: "text", nullable: true),
                    street_view_provider = table.Column<string>(type: "text", nullable: true),
                    street_view_url = table.Column<string>(type: "text", nullable: true),
                    media_verified_at = table.Column<DateOnly>(type: "date", nullable: true),
                    visual_sources = table.Column<string>(type: "jsonb", nullable: true),
                    prompt = table.Column<string>(type: "text", nullable: false),
                    visual_gradient = table.Column<string>(type: "jsonb", nullable: false),
                    clues = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_locations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "session_rounds",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    session_id = table.Column<Guid>(type: "uuid", nullable: false),
                    location_id = table.Column<string>(type: "text", nullable: false),
                    round_number = table.Column<int>(type: "integer", nullable: false),
                    visual_source = table.Column<string>(type: "jsonb", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    guess_label = table.Column<string>(type: "text", nullable: true),
                    guess_latitude = table.Column<double>(type: "double precision", nullable: true),
                    guess_longitude = table.Column<double>(type: "double precision", nullable: true),
                    distance_km = table.Column<double>(type: "double precision", nullable: true),
                    score = table.Column<int>(type: "integer", nullable: false),
                    resolution_reason = table.Column<string>(type: "text", nullable: true),
                    resolved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_session_rounds", x => x.id);
                    table.ForeignKey(
                        name: "FK_session_rounds_game_sessions_session_id",
                        column: x => x.session_id,
                        principalTable: "game_sessions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_session_rounds_locations_location_id",
                        column: x => x.location_id,
                        principalTable: "locations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_session_rounds_location_id",
                table: "session_rounds",
                column: "location_id");

            migrationBuilder.CreateIndex(
                name: "IX_session_rounds_session_id",
                table: "session_rounds",
                column: "session_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "session_rounds");

            migrationBuilder.DropTable(
                name: "game_sessions");

            migrationBuilder.DropTable(
                name: "locations");
        }
    }
}
