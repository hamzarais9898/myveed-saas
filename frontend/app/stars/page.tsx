import { redirect } from 'next/navigation';

export default function StarsRedirect() {
    redirect('/create-influencer');
    return null;
}
