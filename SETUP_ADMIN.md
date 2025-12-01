# Admin Setup Instructions

## Creating Default Admin User

To create the default admin user with credentials:
- **Email/Username**: `admin@gmail.com`
- **Password**: `123456`

Run the following command from the `backend` directory:

```bash
cd backend
npm run seed:admin
```

This will:
1. Create an admin user if it doesn't exist
2. Update the admin credentials if the user already exists
3. Set the email to `admin@gmail.com` and password to `123456`

## Login

After seeding, you can login to the admin panel using:
- **Email/User ID**: `admin@gmail.com`
- **Password**: `123456`

## Changing Credentials

Once logged in, you can change your email/username and password from the **Settings** page in the admin panel.

## Features Added

✅ Default admin credentials (admin@gmail.com / 123456)
✅ Login with email or userId
✅ Professional, simple admin panel design
✅ Settings page to change email/username
✅ Settings page to change password
✅ Improved UI with better styling and gradients

