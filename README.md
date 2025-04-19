# Ops-Dashboard

## Technologies Used

- [Next.js 14](https://nextjs.org/docs/getting-started)
- [NextUI v2](https://nextui.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)

## How to run locally

### Install dependencies

First copy the .env file and enter your MONETIC_GITHUB_TOKEN
In a terminal export the file to your global variables:
`export MONETIC_GITHUB_TOKEN=your_token`

Then proceed to install the dependencies

```bash
pnpm install
```

### Run the development server

```bash
pnpm run dev
```

### Run together with local sdk

If you want to develop this project together with the Monetic SDK and make changes to both, you can add a symlink to your local Monetic SDK. Make sure your local Monetic SDK is built and has a 'dist' folder.

Add the following to package.json

```bash
    "@monetic-labs/sdk": "file:../sdk-your-path",
```

You might need to clear NextJS cache

```bash
rm -rf .next
```
