import { getServices } from "@/lib/api";
import ServiceCard from "@/components/ServiceCard";
import styles from "./page.module.css";
import { Bell, Search, BookOpen } from "lucide-react";

export default async function Home() {
  const services = await getServices();

  // Group services by category for better UX
  const categories = Array.from(new Set(services.map(s => s.category)));

  return (
    <main className="container">
      {/* App Bar */}
      <header className={styles.appBar}>
        <div className={styles.logo}>
          <div className={styles.logoIconBg}>
            <BookOpen size={20} color="white" fill="white" />
          </div>
          <span className={styles.logoText}>BookFlow</span>
        </div>
        <button className={styles.notificationBtn}>
          <Bell size={22} color="#121212" />
          <span className={styles.badge}>2</span>
        </button>
      </header>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input type="text" placeholder="ค้นหาบริการ..." className={styles.searchInput} disabled />
        </div>
      </div>

      <div className={styles.content}>
        {categories.map(category => (
          <section key={category} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.categoryTitle}>{category}</h2>
              <button className={styles.seeAllBtn}>ดูทั้งหมด</button>
            </div>
            <div className={styles.list}>
              {services.filter(s => s.category === category).map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
