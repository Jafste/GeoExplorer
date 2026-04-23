FROM mcr.microsoft.com/dotnet/sdk:8.0

WORKDIR /workspace/src/backend

COPY src/backend/backend.csproj ./backend.csproj
RUN dotnet restore backend.csproj

COPY src/backend ./
COPY src/database ../database

CMD ["sh", "-c", "dotnet restore && dotnet watch run --project backend.csproj --urls http://0.0.0.0:8080"]
