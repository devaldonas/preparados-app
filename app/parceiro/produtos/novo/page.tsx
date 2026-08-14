// Adicionar campo de peso do produto
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Peso (kg)
  </label>
  <input
    type="number"
    name="weight"
    value={formData.weight || 0.5}
    onChange={handleChange}
    step="0.1"
    min="0.1"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
    placeholder="0.5"
  />
  <p className="text-xs text-gray-400 mt-1">
    Peso aproximado do produto para cálculo de frete
  </p>
</div>
