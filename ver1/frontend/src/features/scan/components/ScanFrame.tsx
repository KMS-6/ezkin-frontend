import { Sparkles } from 'lucide-react'

export function ScanFrame() {
  return (
    <section className="relative mt-6 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#8064d8] to-[#5637ad] px-5 py-7 text-white shadow-hero">
      <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-white/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-14 -left-10 size-36 rounded-full bg-white/10" aria-hidden="true" />

      <div className="relative mx-auto h-[250px] max-w-[250px]" role="img" aria-label="얼굴 정면 스캔 가이드">
        <span className="absolute left-0 top-0 h-12 w-12 rounded-tl-[18px] border-l-2 border-t-2 border-white/70" />
        <span className="absolute right-0 top-0 h-12 w-12 rounded-tr-[18px] border-r-2 border-t-2 border-white/70" />
        <span className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-[18px] border-b-2 border-l-2 border-white/70" />
        <span className="absolute bottom-0 right-0 h-12 w-12 rounded-br-[18px] border-b-2 border-r-2 border-white/70" />

        <div className="absolute left-1/2 top-1/2 h-[196px] w-[142px] -translate-x-1/2 -translate-y-1/2 rounded-[48%_48%_45%_45%/42%_42%_56%_56%] border-2 border-white/55">
          <span className="absolute left-7 top-[78px] h-px w-7 rounded bg-white/50" />
          <span className="absolute right-7 top-[78px] h-px w-7 rounded bg-white/50" />
          <span className="absolute left-1/2 top-[91px] h-9 w-px -translate-x-1/2 bg-white/35" />
          <span className="absolute bottom-10 left-1/2 h-px w-10 -translate-x-1/2 rounded bg-white/45" />
        </div>
      </div>

      <p className="relative mt-5 flex items-center justify-center gap-2 text-center text-[12px] font-medium text-white/90">
        <Sparkles size={14} aria-hidden="true" /> 자연광 아래에서 얼굴을 정면으로 보여주세요.
      </p>
    </section>
  )
}
