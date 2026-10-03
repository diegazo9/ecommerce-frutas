export const Wholesale = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-12 rounded-[3rem] shadow-2xl">
        <span className="text-5xl mb-6 block">🏢</span>
        <h1 className="text-4xl font-black mb-6">Ventas por Mayor</h1>
        <p className="text-slate-300 text-xl mb-8 max-w-2xl mx-auto">
          Abastecemos a restaurantes, hoteles, verdulerías y servicios de catering con la mejor selección de mercadería al por mayor, a precios súper competitivos.
        </p>
        <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md max-w-lg mx-auto">
          <h3 className="font-bold text-xl mb-4">¿Querés que seamos tu proveedor?</h3>
          <p className="mb-6">Dejanos tus datos y un asesor comercial se pondrá en contacto a la brevedad.</p>
          <a href="mailto:mayoristas@vibranfrut.com" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-4 rounded-full transition-colors shadow-lg shadow-emerald-500/30">
            Contactar a Ventas
          </a>
        </div>
      </div>
    </div>
  );
};
