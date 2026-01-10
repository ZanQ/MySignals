# GitHub Actions Deployment Setup

## 📋 Overview
This workflow automatically deploys your MySignals API server whenever you push to the `main` branch. It will:
1. SSH into your production server
2. Pull the latest code from GitHub
3. Install dependencies
4. Stop the current PM2 process
5. Start the server with PM2

---

## 🔐 Step 1: Add GitHub Secrets

Go to your GitHub repository and add the following secrets:

### Navigate to Secrets:
1. Go to your GitHub repository
2. Click **Settings** (top right)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**

### Add These Secrets:

#### 1. `SSH_HOST`
- **Value**: Your server IP address or domain
- **Example**: `203.0.113.45` or `myserver.com`

#### 2. `SSH_USERNAME`
- **Value**: Your SSH username on the server
- **Example**: `ubuntu`, `root`, `zan`, etc.

#### 3. `SSH_PRIVATE_KEY`
- **Value**: Your **private SSH key** (the entire contents)
- **How to get it**:
  ```bash
  # On your local machine (where you normally SSH from):
  cat ~/.ssh/id_rsa
  # Or if you have a different key name:
  cat ~/.ssh/your_key_name
  ```
- **Important**: Copy the ENTIRE key including:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ... (all the key content) ...
  -----END OPENSSH PRIVATE KEY-----
  ```

#### 4. `SSH_PORT`
- **Value**: SSH port (usually `22`)
- **Example**: `22`

#### 5. `PROJECT_PATH`
- **Value**: The absolute path to your project on the server
- **Example**: `/home/ubuntu/MySignals` or `/var/www/mysignals`

---

## 📁 Step 2: What You've Already Got

I've created the deployment workflow at:
- **.github/workflows/deploy.yml** ✅

This file is already in your project and ready to use.

---

## 🧪 Step 3: Test the Deployment

### Option A: Push to Main Branch (Automatic)
```bash
git add .
git commit -m "Setup GitHub Actions deployment"
git push origin main
```

### Option B: Manual Trigger
1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **Deploy to Production Server** workflow
4. Click **Run workflow** button
5. Select branch and click **Run workflow**

---

## 🔍 Step 4: Monitor Deployment

1. Go to **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Watch the logs in real-time to see:
   - Code being pulled
   - Dependencies being installed
   - Server stopping/starting
   - Final status

---

## ⚠️ Important Server Prerequisites

Make sure your production server has:

1. **Git installed**:
   ```bash
   sudo apt update && sudo apt install git -y
   ```

2. **Node.js and npm installed**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install nodejs -y
   ```

3. **PM2 installed globally**:
   ```bash
   sudo npm install -g pm2
   ```

4. **Your project already cloned** in the PROJECT_PATH location:
   ```bash
   cd /home/ubuntu  # or wherever
   git clone https://github.com/YOUR_USERNAME/MySignals.git
   cd MySignals
   npm install
   ```

5. **SSH key authentication configured** (GitHub → Server):
   - Your server must be able to pull from GitHub
   - Add your server's SSH public key to GitHub deploy keys:
     - On server: `cat ~/.ssh/id_rsa.pub`
     - GitHub repo → Settings → Deploy keys → Add deploy key

6. **.env file exists** on the server with production credentials

---

## 🔧 Customization Options

### Change the branch
Edit `.github/workflows/deploy.yml` line 5:
```yaml
branches:
  - main  # Change to 'master' or any other branch
```

### Change PM2 startup behavior
If you want to use PM2 without the ecosystem file:
```yaml
pm2 stop app
pm2 start src/index.js --name app
```

### Add database migrations
Add this before starting the server:
```yaml
echo "🔄 Running migrations..."
npm run migrate
```

### Run tests before deploying
Add this step before the SSH action:
```yaml
- name: Run tests
  run: |
    npm install
    npm test
```

---

## 🐛 Troubleshooting

### "Permission denied (publickey)" error
- Make sure `SSH_PRIVATE_KEY` secret contains the full private key
- Verify the key has proper line breaks (don't remove them)
- Ensure the public key is in `~/.ssh/authorized_keys` on the server

### "pm2 command not found"
- Install PM2 globally: `sudo npm install -g pm2`
- Or use npm start directly: `npm start &`

### "git pull" fails
- Ensure GitHub deploy key is added to your repo
- Or use HTTPS with GitHub token

### Port already in use
- The PM2 stop/start commands should handle this
- Manually kill process: `lsof -ti:8888 | xargs kill -9`

---

## 📝 Next Steps

1. **Add all secrets** to GitHub (Step 1 above)
2. **Push this deployment file** to your repository
3. **Watch the Action run** and verify successful deployment
4. **Test your API** to confirm it's running

Your deployment is now automated! Every push to main will automatically update your production server. 🚀
