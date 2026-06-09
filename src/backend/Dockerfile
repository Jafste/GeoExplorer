FROM mcr.microsoft.com/dotnet/sdk:8.0 AS development

WORKDIR /workspace/src/backend

COPY src/backend/backend.csproj ./backend.csproj
RUN dotnet restore backend.csproj

COPY src/backend ./
COPY src/database ../database

CMD ["sh", "-c", "dotnet restore && dotnet watch run --project backend.csproj --urls http://0.0.0.0:8080"]

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /workspace

COPY src/backend/backend.csproj src/backend/backend.csproj
RUN dotnet restore src/backend/backend.csproj

COPY src/backend src/backend
COPY src/database src/database

RUN dotnet publish src/backend/backend.csproj \
    --configuration Release \
    --output /workspace/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS production

WORKDIR /workspace/src/backend

ENV ASPNETCORE_URLS=http://0.0.0.0:8080

COPY --from=build /workspace/publish ./
COPY --from=build /workspace/src/database ../database

EXPOSE 8080

ENTRYPOINT ["dotnet", "backend.dll"]
