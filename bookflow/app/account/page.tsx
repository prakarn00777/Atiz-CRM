import styles from "@/app/page.module.css";
import Button from "@/components/Button";

export default function AccountPage() {
    return (
        <main className="container">
            <header className={styles.appBar}>
                <div className={styles.categoryTitle}>Account</div>
            </header>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eee' }}></div>
                    <div>
                        <h3 style={{ fontWeight: '600' }}>Guest User</h3>
                        <p style={{ fontSize: '14px', color: '#666' }}>Sign in to sync data</p>
                    </div>
                </div>

                <Button variant="outline">Sign In</Button>
                <Button variant="outline" style={{ border: 'none', color: '#dc3545', justifyContent: 'flex-start', paddingLeft: 0 }}>Log Out</Button>
            </div>
        </main>
    );
}
