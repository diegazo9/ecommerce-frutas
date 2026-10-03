export const Recipes = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-black text-slate-800 mb-2">Recetas Saludables</h1>
      <p className="text-slate-500 text-lg mb-10">Descubrí formas increíbles de preparar tus frutas y verduras.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { title: 'Jugo Detox Verde', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=500', desc: 'Manzana verde, apio, pepino y espinaca. Ideal para empezar el día con energía.' },
          { title: 'Ensalada de Frutas Tropical', img: 'https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?q=80&w=500', desc: 'Mango, piña, papaya y un toque de menta fresca.' },
          { title: 'Tarta Rústica de Tomates', img: 'https://images.unsplash.com/photo-1599815049386-db393fa11075?q=80&w=500', desc: 'Tomates cherry asados con albahaca sobre masa hojaldrada.' },
        ].map((recipe, idx) => (
          <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer">
            <div className="h-48 overflow-hidden">
              <img src={recipe.img} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-xl text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">{recipe.title}</h3>
              <p className="text-slate-500 text-sm">{recipe.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
