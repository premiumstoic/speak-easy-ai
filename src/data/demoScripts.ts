import type { TripwireId } from "@/types/therapyEvents";

export interface DemoTurn {
  speaker: "A" | "B";
  text: string;
  /** If set, triggers this tripwire after the line is spoken */
  tripwire?: TripwireId;
  /** Pause in ms after this turn (default: 1200) */
  pauseAfter?: number;
}

/**
 * Guided Enactment (Open Mediation) — Turkish dialogue.
 * Tension is high. "Sen" language and blame fly back and forth.
 * The AI Process Observer interrupts at the escalation peak.
 */
export const openMediationScript: DemoTurn[] = [
  {
    speaker: "B",
    text: "Ayşe yine mi aynı konu? Harcamalarımıza dikkat etmemiz lazım diyorum.",
    pauseAfter: 1800,
  },
  {
    speaker: "A",
    text: "Sen her şeye karışıyorsun Burak! Aldığım iki parça eşya mı batıyor sana?",
    pauseAfter: 1500,
  },
  {
    speaker: "B",
    text: "İki parça değil, sürekli bir şeyler geliyor eve. Gelecek için para biriktirmemiz lazım.",
    pauseAfter: 1500,
  },
  {
    speaker: "A",
    text: "Gelecek gelecek... Yaşayamıyoruz ki biz şu anı! Hep senin planların, senin kuralların.",
    pauseAfter: 1200,
  },
  {
    speaker: "B",
    text: "Benim kurallarım mı? Ben sadece mantıklı olmaya çalışıyorum.",
    pauseAfter: 1200,
  },
  {
    speaker: "A",
    text: "Senin mantığın beni boğuyor. Kendi paramı harcarken senden izin mi alacağım?",
    pauseAfter: 1000,
  },
  {
    speaker: "B",
    text: "Olay izin değil, biz bir ekibiz. Ama sen kafana göre takılıyorsun.",
    pauseAfter: 1000,
  },
  {
    speaker: "A",
    text: "Çünkü sen beni hiçbir zaman dinlemiyorsun. Hep kendi doğruların var.",
    pauseAfter: 800,
  },
  {
    speaker: "B",
    text: "Sen de hep savunmaya geçiyorsun! Bir kere de haklısın de artık.",
    pauseAfter: 800,
  },
  {
    speaker: "A",
    text: "Haklı falan değilsin. Sadece beni kontrol etmeye çalışıyorsun.",
    pauseAfter: 800,
  },
  {
    speaker: "B",
    text: "Kontrol mü? İyiliğimiz için uğraşmak kontrol mü oldu şimdi?",
    pauseAfter: 800,
  },
  {
    speaker: "A",
    text: "Evet! Bu evde benim ne istediğim hiçbir zaman önemli olmadı zaten.",
    tripwire: "the_escalation",
    pauseAfter: 1000,
  },
];

/**
 * Imago Dialogue — Turkish dialogue.
 * Ayşe opens her feelings, the system guides Burak from blame to mirroring.
 * Structured: Sender → Mirroring → Validation → Empathy.
 */
export const imagoDialogueScript: DemoTurn[] = [
  // Sender phase — Ayşe shares her feelings
  {
    speaker: "A",
    text: "Burak, dün akşam eve geldiğinde bilgisayarı açıp hemen çalışmaya başlaman beni çok kırdı. Kendimi bu evde görünmez gibi hissediyorum. En azından bir nasılsın demeni, benimle beş dakika oturmanı beklerdim. Benimle bağ kurmaman beni değersiz hissettiriyor.",
    pauseAfter: 2500,
  },
  // Mirroring phase — Burak reflects what he heard
  {
    speaker: "B",
    text: "Duyduğum kadarıyla, dün akşam eve geldiğimde hemen bilgisayara geçmem seni çok kırmış. Evde kendini görünmez hissediyorsun ve en azından bir nasılsın dememi, seninle biraz oturmamı bekliyordun. Bağ kurmamam seni değersiz hissettirmiş.",
    pauseAfter: 2500,
  },
  // Validation phase — Burak validates
  {
    speaker: "B",
    text: "Bu çok anlamlı çünkü herkes eve geldiğinde görülmek ve değer verilmek ister. Senin bu şekilde hissetmen tamamen anlaşılır bir şey. Haklısın, beş dakika bile olsa sana zaman ayırmalıydım.",
    pauseAfter: 2500,
  },
  // Empathy phase — Burak empathizes
  {
    speaker: "B",
    text: "Sanırım şu an çok yalnız ve görünmez hissediyorsun. Belki de birbirimizden uzaklaşıyoruz diye korkuyorsun. Bu seni üzüyor ve hüzünlendiriyor.",
    pauseAfter: 2000,
  },
];

/** Turkish intervention text overrides for demo mode */
export const DEMO_INTERVENTIONS: Partial<Record<TripwireId, string>> = {
  the_loop:
    "Fark ediyorum ki daireler çizmeye başlıyoruz. Bu döngüye girdiğimizde, genellikle ikiniz de duyulmak için çok çabalıyorsunuz ama hiçbiriniz anlaşıldığını hissetmiyor. Bir nefes alalım.",
  the_missed_drop:
    "Burada nazikçe durdurmak istiyorum, çünkü çok önemli bir şey oldu. Az önce çok kırılgan bir duygu paylaşıldı. İlerlemeden önce o ana alan açalım.",
  the_escalation:
    "Burada duruyoruz. Konuşmanın sıcaklığı çok yükseldi ve birbirimize iyileştirmekten çok zarar verecek şekilde konuşuyoruz. Birlikte derin bir nefes alalım.",
  the_stonewall:
    "Konuşmayı durdurmak istiyorum. Her şeyin sessizleştiğini fark ediyorum. Bazen duygu çok yoğunlaştığında, sistemimizin kapanması doğaldır. Şu an çok bunaltıcı mı hissediyorsun?",
};

export const DEMO_SCRIPTS = {
  open_mediation_enactment: openMediationScript,
  imago_core_dialogue: imagoDialogueScript,
} as const;
