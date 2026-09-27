import { useState, useEffect, useCallback } from 'react';
import { adminProductApi, adminCategoryApi } from '../../api';
import type { AdminProduct, CreateProductRequest, UpdateProductRequest, Category } from '../../types';

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateProductRequest>({
    title: '',
    price: 0,
    stockQuantity: 0,
    description: '',
    categoryId: 0,
    isActive: true,
  });

  const loadCategories = async () => {
    try {
      const { data } = await adminCategoryApi.getAll();
      setCategories(data.filter((c) => c.isActive));
    } catch {
      console.error('Failed to load categories');
    }
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminProductApi.getProducts(page, 20);
      setProducts(data.items);
      setTotalPages(data.totalPages);
    } catch {
      setError('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadProducts]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5 МБ');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Допустимы только JPG, PNG, WebP');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingProduct) {
        const request: UpdateProductRequest = {
          title: formData.title,
          price: formData.price,
          stockQuantity: formData.stockQuantity,
          description: formData.description,
          categoryId: formData.categoryId,
          isActive: formData.isActive,
        };
        await adminProductApi.update(editingProduct.id, request);
        if (imageFile) {
          await adminProductApi.uploadImage(editingProduct.id, imageFile);
        }
      } else {
        const request: CreateProductRequest = {
          title: formData.title,
          price: formData.price,
          stockQuantity: formData.stockQuantity,
          description: formData.description,
          categoryId: formData.categoryId,
          isActive: formData.isActive,
        };
        const { data: newProduct } = await adminProductApi.create(request);
        if (imageFile) {
          await adminProductApi.uploadImage(newProduct.id, imageFile);
        }
      }
      setShowModal(false);
      resetForm();
      loadProducts();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Ошибка при сохранении');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      price: product.price,
      stockQuantity: product.stockQuantity,
      description: product.description || '',
      categoryId: product.categoryId,
      isActive: product.isActive,
    });
    setImageFile(null);
    setImagePreview(product.imageUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.imageUrl}` : null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Деактивировать этот товар? (Товары с заказами не удаляются, а только деактивируются)')) return;
    try {
      await adminProductApi.deactivate(id);
      loadProducts();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Не удалось деактивировать товар');
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      price: 0,
      stockQuantity: 0,
      description: '',
      categoryId: categories[0]?.id || 0,
      isActive: true,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
        <button onClick={openCreateModal} className="px-4 py-2 text-white bg-pink-600 rounded-lg font-medium hover:bg-pink-700 transition-colors">
          Добавить товар
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Изображение</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Категория</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Остаток</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 ${!product.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
                    <td className="px-4 py-4">
                      {product.imageUrl && (
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${product.imageUrl}`}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900 max-w-xs truncate">{product.title}</td>
                    <td className="px-4 py-4 text-gray-700">{product.categoryName}</td>
                    <td className="px-4 py-4 text-gray-900">{product.price.toLocaleString('ru-RU')} ₽</td>
                    <td className="px-4 py-4 text-gray-900">{product.stockQuantity} шт.</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {product.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-pink-600 hover:text-pink-700 text-sm font-medium mr-3"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        {product.isActive ? 'Деактивировать' : 'Удалить'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="p-12 text-center text-gray-500">Товаров пока нет</div>
            )}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center space-x-2" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Назад
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-700">
                Страница {page} из {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Вперёд →
              </button>
            </nav>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} aria-hidden="true" />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h3 id="product-modal-title" className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'Редактировать товар' : 'Новый товар'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600" aria-label="Закрыть">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Название <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Цена <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="price"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Остаток <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="stockQuantity"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                    Категория <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: parseInt(e.target.value) }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Изображение {editingProduct ? '(оставить пустым, чтобы не менять)' : ''}
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded border border-gray-200" />
                    </div>
                  )}
                </div>
                {editingProduct && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">Активен</label>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Отмена
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors">
                    {submitting ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}