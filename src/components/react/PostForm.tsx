import React, { useState } from 'react';
import { useNotifications } from './NotificationProvider';

interface PostFormData {
  content: string;
  image?: File | null;
}

interface PostFormErrors {
  content?: string;
}

interface PostFormProps {
  serverName?: string;
  placeholder?: string;
  showNameField?: boolean;
}

const PostForm: React.FC<PostFormProps> = ({ 
  serverName = '',
  placeholder = '¿Qué está pasando en el servidor?',
  showNameField = false
}) => {
  const [formData, setFormData] = useState<PostFormData>({
    content: '',
    image: null
  });
  const [authorName, setAuthorName] = useState('');
  const [errors, setErrors] = useState<PostFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotifications();

  const validateForm = (): boolean => {
    const newErrors: PostFormErrors = {};

    if (!formData.content.trim()) {
      newErrors.content = 'El contenido del post es requerido';
    }

    if (showNameField && !authorName.trim()) {
      newErrors.content = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, content: e.target.value }));
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get user session
      const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
      
      if (!userSession) {
        addNotification('Debes iniciar sesión para publicar', 'error');
        return;
      }

      const user = JSON.parse(userSession).user;
      const author = showNameField ? authorName : user.username || user.full_name || 'Usuario';
      
      // Create post data
      const postData = {
        id: Date.now().toString(),
        author: author,
        content: formData.content,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        serverName: serverName,
        userId: user.id
      };

      // Get existing posts for this server
      const storageKey = serverName ? `posts_${serverName}` : 'posts_general';
      const existingPosts = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Add new post to the beginning
      existingPosts.unshift(postData);
      
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(existingPosts));
      
      // Reset form
      setFormData({ content: '', image: null });
      setAuthorName('');
      
      // Show success notification
      addNotification('Post publicado exitosamente', 'success');
      
      // Dispatch custom event to reload posts
      const event = new CustomEvent('postAdded', {
        detail: { serverName, post: postData }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Error creating post:', error);
      addNotification('Error al publicar el post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Comparte tu experiencia</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {showNameField && (
          <div>
            <input 
              type="text" 
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Tu nombre" 
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
            />
          </div>
        )}
        
        <div>
          <textarea 
            value={formData.content}
            onChange={handleContentChange}
            placeholder={placeholder}
            className={`w-full bg-white/5 border rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.content ? 'border-red-500' : 'border-white/20'
            }`}
            rows={3}
            disabled={isSubmitting}
          />
          {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {showNameField ? 'Añadir imagen' : ''}
              <input 
                type="file" 
                onChange={handleImageChange}
                className="hidden" 
                accept="image/*"
                disabled={isSubmitting}
              />
            </label>
            
            {formData.image && (
              <span className="text-sm text-green-400">
                Imagen seleccionada: {formData.image.name}
              </span>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-semibold"
          >
            {isSubmitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;