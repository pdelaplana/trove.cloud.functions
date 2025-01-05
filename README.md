# trove.functions

## Git Submodule Configuration

To configure this project with git submodules:

1. Initialize the submodule:

   ```bash
   git submodule add <repository-url> <path>
   ```

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
