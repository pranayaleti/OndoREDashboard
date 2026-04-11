interface PageBannerProps {
  title: string
  subtitle: string
  backgroundImage?: string
}

export function PageBanner({ title, subtitle, backgroundImage }: PageBannerProps) {
  return (
    <section className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-card/90 to-background/90 z-10" />
      <div className="relative h-[300px] overflow-hidden">
        {backgroundImage ? (
          <img
            src={backgroundImage || `${import.meta.env.BASE_URL}placeholder.svg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <img src={`${import.meta.env.BASE_URL}modern-apartment-balcony.png`} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      <div className="absolute inset-0 flex items-center z-20">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
            <p className="text-xl text-white/90">{subtitle}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
