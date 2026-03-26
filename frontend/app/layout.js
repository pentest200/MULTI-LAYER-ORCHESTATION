import './globals.css';
import { AuthProvider } from '@/lib/auth';
import AppLayout from '@/components/AppLayout';

export const metadata = {
    title: 'AI Agent Command Center',
    description: 'Launch, monitor, and control multiple AI agents with human oversight',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <AppLayout>{children}</AppLayout>
                </AuthProvider>
            </body>
        </html>
    );
}
