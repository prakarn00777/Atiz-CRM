import styles from "@/app/page.module.css";

export default function CalendarPage() {
    return (
        <main className="container">
            <header className={styles.appBar}>
                <div className={styles.categoryTitle}>Calendar</div>
            </header>
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                <p>Calendar view coming soon.</p>
            </div>
        </main>
    );
}
