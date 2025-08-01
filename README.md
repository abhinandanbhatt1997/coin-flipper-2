# Money Pool Game

A web-based money pooling game where 10 players join each round with ₹100 entry fee. One winner receives ₹150, and the remaining 9 players get ₹80 each.

## Features

- **OTP Authentication**: Phone/Email based login
- **Wallet Management**: Add money via Razorpay, withdraw funds
- **Real-time Games**: Auto-start when 10 players join
- **Game History**: Track wins, losses, and statistics
- **Responsive Design**: Works on all devices

## Game Rules

- Entry fee: ₹100 per player
- Maximum players: 10 per round
- Winner selection: Random (10% chance to win)
- Winner prize: ₹150 (1.5x entry)
- Other players: ₹80 each (0.8x entry)
- Platform fee: ~13% per round

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database + Edge Functions)
- **Authentication**: Supabase Auth with OTP
- **Payments**: Razorpay integration
- **Real-time**: Supabase subscriptions

## Setup Instructions

### 1. Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the SQL migration in `supabase/create_tables.sql`
3. Deploy the edge functions:
   - `supabase/functions/join-game/`
   - `supabase/functions/create-payment-order/`
   - `supabase/functions/verify-payment/`
   - `supabase/functions/process-withdrawal/`

### 3. Razorpay Setup

1. Create a Razorpay account
2. Get your Key ID from the dashboard
3. Configure webhooks for payment verification

### 4. Run the Application

```bash
npm install
npm run dev
```

## Database Schema

### Tables

- **users**: User profiles with wallet balances
- **games**: Game rounds and status
- **game_participants**: Player participation records
- **transactions**: Financial transaction log

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Games and participants are publicly readable for transparency

## Payment Flow

1. **Deposit**: User initiates deposit → Razorpay checkout → Payment verification → Wallet update
2. **Game Entry**: Check balance → Deduct fee → Join game → Auto-process when full
3. **Withdrawal**: Check balance → Deduct amount → Process withdrawal request

## Game Logic

1. Users join games by paying ₹100 entry fee
2. When 10 players join, game auto-processes:
   - Randomly select 1 winner
   - Winner gets ₹150 added to wallet
   - Other 9 players get ₹80 each
   - Platform retains ₹130 as profit (13%)
3. All balances update in real-time
4. Transaction history is maintained

## Security Considerations

- All payments processed through secure Razorpay gateway
- Database access controlled by RLS policies
- Real-time updates use secure WebSocket connections
- Input validation on all user data
- Transaction logging for audit trails

## Production Deployment

1. Set up Supabase production project
2. Configure Razorpay production keys
3. Deploy edge functions to Supabase
4. Build and deploy frontend to your hosting platform
5. Configure domain and SSL certificates

## License

MIT License - see LICENSE file for details.
MIT License - see LICENSE file for details.# coin-flipper-2
