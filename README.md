# Wollomat

Wollomat is a lightweight, self-hosted web application that allows closed groups to collectively sign agreements, petitions, or open letters. Every signature is verified using a double-opt-in email link to prevent unauthorized entries, and document creators can manage all their published texts and signatures from a passwordless dashboard.

## Features

- ✍️ **Simple Document Creation**: Publish structured agreements in seconds.
- 💬 **Optional Signee Comments**: Allow signatories to leave public comments alongside their signatures.
- ✉️ **Passwordless Verification**:
  - Signatories verify their signature via a double-opt-in verification link sent to their email.
  - Creators sign in to their dashboard via passwordless magic login links.
- 📊 **Creator Dashboard**: Manage all your published documents, audit signatures log, view pending requests, and close or open signing.
- 📄 **A4 PDF Exporter**: Generate verified public signature sheets or complete auditable audit ledgers (including signatory emails and comments) directly from the browser.
- 🎨 **Modern Minimalist UI**: Sleek ivory and slate dark/light styling with smooth micro-animations.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions/APIs, React 19)
- **Database**: PostgreSQL (Prisma ORM)
- **Styling**: Tailwind CSS & Vanilla CSS
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Email Delivery**: [Resend](https://resend.com/)

---

## Getting Started (Local Development)

### 1. Prerequisites
- Node.js (v18 or higher)
- A local PostgreSQL database (or Neon/Supabase instance)
- A Resend account (for email verification)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root of the project:
```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/wollomat"

# Resend Mail Configuration
RESEND_API_KEY="re_123456789..."
EMAIL_FROM="Wollomat <noreply@yourdomain.com>"

# Application Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3005"
```
> **Note**: If `RESEND_API_KEY` is empty or set to `"local"`, Wollomat runs in **Local Test Mode**, where all signee verification links and creator login magic links are printed directly to the server terminal console instead of being emailed.

### 4. Database Setup & Client Generation
Run migrations to set up your database tables and generate the Prisma Client:
```bash
npx prisma migrate dev --name init
```

### 5. Start Development Server
```bash
npm run dev -- -p 3005
```
Open [http://localhost:3005](http://localhost:3005) in your browser.

---

## Production Deployment on Vercel

1. **Deploy Repository**: Push your code to a Git provider (GitHub, GitLab, or Bitbucket) and import it into Vercel.
2. **Configure Database**: Create a serverless PostgreSQL database (Vercel Postgres or Neon) and link it to your project. Vercel automatically exposes the `DATABASE_URL` variable.
3. **Set Project Environment Variables**:
   - `NEXT_PUBLIC_APP_URL`: Set this to your live domain (e.g., `https://wollomat.vercel.app`).
   - `RESEND_API_KEY`: Your Resend API key.
   - `EMAIL_FROM`: Your verified sender address.
4. **Deploy**: Vercel will install dependencies, trigger `prisma generate` automatically via the `postinstall` script, and compile your optimized production build.
5. **Run Production Migrations**:
   Run the production schema sync command:
   ```bash
   npx prisma db push
   ```
