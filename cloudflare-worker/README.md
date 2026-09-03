# Cloudflare R2 Upload Worker Setup

This worker allows your HCMS app to upload medical imaging and documents directly to your **xrays** R2 bucket with zero bandwidth/egress fees.

---

### Step 1: Create the Worker in Cloudflare
1. Go to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left sidebar, click **Compute (Workers & Pages)**.
3. Click **Create** (or **Create application**), then choose **Worker**.
4. Give it a name, for example: `hcms-xray-uploader`.
5. Click **Deploy**.

---

### Step 2: Paste the Worker Code
1. On your worker's overview page, click **Edit code** (in the top-right corner).
2. Replace all the existing code in the editor with the contents of [worker.js](file:///c:/Users/Aryanna/Videos/HCMS/cloudflare-worker/worker.js).
3. Click **Deploy** (top right).

---

### Step 3: Bind your "xrays" R2 Bucket
1. Go back to your Worker page (click the worker name or exit the code editor).
2. Click the **Settings** tab.
3. In the sub-menu, click **Bindings** (or **Variables and Secrets**).
4. Under **R2 Bucket Bindings**, click **Add**:
   - **Variable name**: `R2_BUCKET` *(Must be uppercase exactly like this)*
   - **R2 bucket**: select `xrays`
5. Click **Deploy** or **Save**.

---

### Step 4: Add Worker URL to `.env`
1. Copy the public URL of your worker (shown at the top of your Worker page, like `https://hcms-xray-uploader.<your-subdomain>.workers.dev`).
2. Open your `.env` file in the HCMS project.
3. Set:
   ```env
   VITE_R2_UPLOAD_URL=https://hcms-xray-uploader.<your-subdomain>.workers.dev
   VITE_R2_PUBLIC_DOMAIN=https://pub-5069fda2b35445cb9ff06383cbcea227.r2.dev
   ```
4. Restart your Vite dev server (`yarn dev` or `npm run dev`).
