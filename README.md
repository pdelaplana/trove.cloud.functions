# Trove Cloud Functions

Firebase Cloud Functions implementation for the Trove loyalty rewards platform.

## Project Setup

### Prerequisites

- Node.js 18.x
- Firebase CLI
- Git

### Installation

1. Clone the repository with submodules:

```bash
git clone --recursive https://github.com/yourusername/trove.cloud.functions.git
cd trove.cloud.functions
```

2. Install dependencies:

```bash
cd functions
npm install
```

3. Set up Firebase:

```bash
firebase login
firebase use your-project-id
```

## Development

### Local Development

```bash
npm run build:watch
firebase emulators:start --only functions
```

### Testing

```bash
npm test
npm run test:watch  # For development
```

### Deployment

````bash
npm run deploy      # Deploy to default environment
npm run deploy:dev  # Deploy to development
npm run deploy:prod # Deploy to production


## Git Submodule Configuration

This project uses Git submodules for domain logic. The main submodule is:

- `functions/src/domain`: [trove.domain](https://github.com/pdelaplana/trove.domain.git)


To configure this project with git submodules:

1. Initialize the submodule:

   ```bash
   git submodule add <repository-url> <path>
````

2. Update existing submodules:

   ```bash
   git submodule update --init --recursive
   ```

3. Pull latest changes:
   ```bash
   git submodule foreach git pull origin main
   ```

### Important Notes

- Always commit submodule changes separately
- Use absolute URLs for submodules
- Check `.gitmodules` file for configuration

### Current Configuration

The project includes the following submodule:

- `functions/src/domain`: Points to `https://github.com/pdelaplana/trove.domain.git`

To add this specific submodule:

```bash
git submodule add https://github.com/pdelaplana/trove.domain.git functions/src/domain
```

## Project Structure

```
functions/
├── src/
│   ├── domain/          # Domain logic (submodule)
│   ├── endpoints/       # HTTP endpoints
│   ├── shared/         # Shared utilities
│   └── index.ts        # Entry point
├── test/
└── package.json
```

## Environment Configuration

1. Create `.env` file:

```bash
ENCRYPTION_SECRET=your-secret
```

2. Set Firebase config:

```bash
firebase functions:config:set encryption.secret="your-secret"
```

## CI/CD

GitHub Actions automatically deploy on pushes to main branch. Required secrets:

- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_PROJECT_ID`
- `GH_PAT` (for private submodules)
