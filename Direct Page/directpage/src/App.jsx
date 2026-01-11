import React from 'react'
import {
  CheckCircle2,
  XCircle,
  Play,
  Plus,
  ArrowRight,
  Smartphone,
  CreditCard,
  Clock,
  ShieldCheck,
  ChevronDown,
  Facebook,
  LineChart,
  UserCircle2,
  FileText,
  CheckCircle
} from 'lucide-react'
import './App.css'

function App() {
  const [activeSlide, setActiveSlide] = React.useState(0)
  const edcSlides = [
    '/assets/edc_slide1.png',
    '/assets/edc_slide2.png',
    '/assets/edc_slide3.png'
  ]

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % edcSlides.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [edcSlides.length])

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: 'var(--text-dark)', fontWeight: 800 }}>ease pay</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline">สมัครฟรี</button>
          <div style={{ width: 24, height: 2, background: '#333', margin: 'auto 0' }}></div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero bg-gradient">
        <div className="container">
          <div className="hero-image-container" style={{ minHeight: '300px' }}>
            <img src="/assets/hero_man.png" alt="Ease Pay Hero" style={{ width: '100%', display: 'block' }} />
            <div className="cta-sticky">
              <button className="btn-primary" style={{ boxShadow: '0 4px 15px rgba(45, 91, 255, 0.4)' }}>
                สมัครเลย
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="video-section">
        <div className="video-placeholder" style={{ border: '4px solid white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: '#000' }}>
          <div className="play-button" style={{ zIndex: 2 }}>
            <Play fill="white" size={24} />
          </div>
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800"
            alt="Fintech Video Thumbnail"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, position: 'absolute', top: 0, left: 0 }}
          />
        </div>
      </section>

      {/* Stats Cards */}
      <section className="stats-grid">
        <div className="stat-card active">
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14px' }}>เครื่องรูดบัตร</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>EDC</div>
        </div>
        <div className="stat-card">
          <div style={{ fontWeight: 700, fontSize: '14px' }}>ชำระผ่านออนไลน์</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Payment Gateway</div>
        </div>
      </section>

      {/* EDC Feature Section with Slider */}
      <section className="edc-section" style={{ padding: '20px 0', overflow: 'hidden' }}>
        <div style={{ padding: '0 20px', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '5px' }}>เครื่องรูดบัตร EDC</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>รับชำระได้ครบ จบในเครื่องเดียว</p>
        </div>

        <div style={{
          display: 'flex',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: `translateX(-${activeSlide * 100}%)`
        }}>
          {edcSlides.map((img, i) => (
            <div key={i} style={{ minWidth: '100%', padding: '0 20px' }}>
              <img
                src={img}
                alt={`EDC Slide ${i + 1}`}
                style={{ width: '100%', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
              />
            </div>
          ))}
        </div>

        {/* Slider Indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {edcSlides.map((_, i) => (
            <div
              key={i}
              onClick={() => setActiveSlide(i)}
              style={{
                width: i === activeSlide ? 24 : 8,
                height: 6,
                borderRadius: '4px',
                background: i === activeSlide ? 'var(--primary)' : '#E0E7FF',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      </section>

      {/* Comparison Section (Image based) */}
      <section className="comparison-section" style={{ padding: '20px 0' }}>
        <div className="container" style={{ padding: '0 10px' }}>
          <img
            src="/assets/vs_comparison.jpg"
            alt="Ease Pay VS General Banks Comparison"
            style={{ width: '100%', borderRadius: '24px', display: 'block' }}
          />
        </div>
      </section>

      {/* Headline section */}
      <section className="text-center section-padding">
        <h2 style={{ fontSize: '32px', color: 'var(--primary)', lineHeight: '1.2', marginBottom: '30px' }}>
          จ่ายกว่า เร็วกว่า<br />โอนเงินทุกวัน
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="benefit-item" style={{ background: 'white', border: '1px solid #EBF1FF' }}>
            <div className="benefit-icon-box" style={{ background: 'var(--primary)' }}><CreditCard size={24} /></div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>ค่าธรรมเนียม 1.0%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ประหยัดราคา ได้มากกว่า เริ่มต้นเพียง 1%</div>
            </div>
          </div>
          <div className="benefit-item" style={{ background: 'white', border: '1px solid #EBF1FF' }}>
            <div className="benefit-icon-box" style={{ background: 'var(--primary)' }}><Clock size={24} /></div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>โอนเงินเข้าบัญชี (T+0)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>โอนทันใจ รับเงินได้ทุกวัน</div>
            </div>
          </div>
          <div className="benefit-item" style={{ background: 'white', border: '1px solid #EBF1FF' }}>
            <div className="benefit-icon-box" style={{ background: 'var(--primary)' }}><ShieldCheck size={24} /></div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>มาตรฐานความปลอดภัย</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ตรวจสอบได้ โปร่งใส เชื่อถือได้</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '30px', color: 'var(--text-muted)', fontSize: '14px' }}>
          ลงทะเบียนกับ Ease Pay<br />ง่ายๆ ใน 3 ขั้นตอน
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps-section text-center" style={{ background: '#EBF1FF', borderRadius: '32px 32px 0 0', marginTop: '20px' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '32px', marginBottom: '20px' }}>3 ขั้นตอน</h2>
        <div className="steps-grid">
          <div className="step-card" style={{ border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f8faff', padding: '15px', borderRadius: '12px' }}>
              <FileText size={32} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
              <div className="step-number" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <div style={{ width: 20, height: 20, background: 'var(--primary)', color: 'white', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '5px' }}>สมัครสมาชิก</div>
            </div>
          </div>
          <div className="step-card" style={{ border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f8faff', padding: '15px', borderRadius: '12px' }}>
              <UserCircle2 size={32} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
              <div className="step-number" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <div style={{ width: 20, height: 20, background: 'var(--primary)', color: 'white', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '5px' }}>ลงทะเบียน</div>
            </div>
          </div>
          <div className="step-card" style={{ border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f8faff', padding: '15px', borderRadius: '12px' }}>
              <CheckCircle size={32} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
              <div className="step-number" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <div style={{ width: 20, height: 20, background: 'var(--primary)', color: 'white', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '5px' }}>เสร็จ!</div>
            </div>
          </div>
        </div>

        <button className="btn-primary" style={{ marginTop: '40px', width: '100%', padding: '15px', borderRadius: '50px', gap: '15px' }}>
          สนใจติดต่อเรา <ArrowRight size={20} />
        </button>

        <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>ศึกษาข้อมูลเพิ่มเติมได้ที่เว็บไซต์</p>
      </section>

      {/* Blogs/Articles Section */}
      <section style={{ padding: '40px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { color: '#2D5BFF', text: 'ยอดขายเพิ่มขึ้นเมื่อมี Ease Pay', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=60&w=400' },
          { color: '#00D1FF', text: 'เทคนิคการรับชำระเงิน', img: 'https://images.unsplash.com/photo-1556742208-999815fca738?auto=format&fit=crop&q=60&w=400' },
          { color: '#00B900', text: 'ความปลอดภัยในการชำระเงิน', img: 'https://images.unsplash.com/photo-1556742205-e10c9486e506?auto=format&fit=crop&q=60&w=400' }
        ].map((blog, i) => (
          <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', background: 'white' }}>
            <div style={{ height: 70 }}>
              <img src={blog.img} alt={blog.text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '8px', fontSize: '10px', fontWeight: 700, textAlign: 'center', color: '#333', minHeight: '40px' }}>
              {blog.text}
            </div>
          </div>
        ))}
      </section>

      {/* EDC Promo */}
      <section style={{ padding: '20px', background: 'linear-gradient(135deg, #2D5BFF 0%, #1a46e6 100%)', borderRadius: '32px', margin: '0 20px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8 }}>เครื่องรับชำระเงินอัจฉริยะ EDC</div>
          <h3 style={{ fontSize: '20px', margin: '10px 0' }}>Ease Pay QR & Card</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <div style={{ background: 'white', borderRadius: '4px', padding: '2px 8px', color: '#2D5BFF', fontSize: '10px', fontWeight: 800 }}>VISA</div>
            <div style={{ background: 'white', borderRadius: '4px', padding: '2px 8px', color: '#2D5BFF', fontSize: '10px', fontWeight: 800 }}>TrueMoney</div>
            <div style={{ background: 'white', borderRadius: '4px', padding: '2px 8px', color: '#2D5BFF', fontSize: '10px', fontWeight: 800 }}>PromptPay</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '40px 20px' }}>
        <h2 style={{ fontSize: '24px', textAlign: 'center', marginBottom: '20px' }}>คำถามที่พบบ่อย FAQ</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            "ค่าธรรมเนียมการรับชำระเงินของ Ease Pay เท่าไหร่?",
            "ต้องฝากเงินประกันเครื่อง EDC หรือไม่?",
            "หากเจอปัญหาในการใช้งาน ต้องติดต่อใคร?",
            "ต้องใช้เอกสารอะไรบ้างในการสมัคร?"
          ].map((q, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '12px', border: '1px solid #eee', background: 'white' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{q}</span>
              <ChevronDown size={16} color="#999" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ marginTop: '40px' }}>
        <div className="text-center" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--primary)', fontWeight: 700, fontSize: '20px' }}>
            <Smartphone size={24} /> 02-123-4567
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#00B900', fontWeight: 700, marginTop: '10px', fontSize: '18px' }}>
            LINE @EasePay_TH
          </div>
        </div>

        <div className="text-center logo" style={{ marginBottom: '10px', fontSize: '24px' }}>ease pay</div>
        <div className="text-center" style={{ fontSize: '11px', color: '#999' }}>
          © 2024 Ease Pay. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default App
