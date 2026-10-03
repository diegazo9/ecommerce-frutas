export const About = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-black text-slate-800 mb-8">Nosotros</h1>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6 text-slate-600 text-lg leading-relaxed">
        <p>
          En <strong>VibranFrut</strong>, nacimos con una misión clara: llevar la frescura del campo directamente a tu mesa, sin intermediarios innecesarios. Somos un equipo apasionado por la alimentación saludable, trabajando todos los días desde temprano para seleccionar las mejores frutas y verduras de estación.
        </p>
        <p>
          Nuestros valores se centran en la <strong>calidad</strong>, el <strong>compromiso</strong> y el <strong>cuidado del medio ambiente</strong>. Cada producto que llega a tu hogar ha sido seleccionado a mano, asegurando que recibas siempre lo mejor.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="text-center p-6 bg-emerald-50 rounded-2xl">
            <div className="text-3xl mb-3">🌱</div>
            <h3 className="font-bold text-emerald-800 mb-2">100% Fresco</h3>
            <p className="text-sm text-emerald-600">De la huerta a tu casa en menos de 24 hs.</p>
          </div>
          <div className="text-center p-6 bg-emerald-50 rounded-2xl">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="font-bold text-emerald-800 mb-2">Comercio Justo</h3>
            <p className="text-sm text-emerald-600">Apoyamos a pequeños productores locales.</p>
          </div>
          <div className="text-center p-6 bg-emerald-50 rounded-2xl">
            <div className="text-3xl mb-3">♻️</div>
            <h3 className="font-bold text-emerald-800 mb-2">Sustentable</h3>
            <p className="text-sm text-emerald-600">Empaques reciclables y reducción de huella.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
