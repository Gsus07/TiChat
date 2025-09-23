import React, { useState, useRef } from 'react';
import { useNotifications } from './NotificationProvider';
import { supabase } from '../../utils/supabaseClient';
import type { PostImageUploadRef } from './PostImageUpload';
import PostImageUpload from './PostImageUpload';


interface PostFormData {
  content: string;
  imageUrl?: string | null;
  imagePath?: string | null;
}

interface PostFormErrors {
  content?: string;
}

interface PostFormProps {
  serverId?: string;
  gameId?: string;
  serverName?: string;
  placeholder?: string;
  showNameField?: boolean;
}

const PostForm: React.FC<PostFormProps> = ({ 
  serverId,
  gameId,
  serverName = '',
  placeholder = '¿Qué está pasando en el servidor?',
  showNameField = false
}) => {
  const [formData, setFormData] = useState<PostFormData>({
    content: '',
    imageUrl: null,
    imagePath: null
  });
  const [authorName, setAuthorName] = useState('');
  const [errors, setErrors] = useState<PostFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotifications();
  const imageUploadRef = useRef<PostImageUploadRef>(null);

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

  const handleImageUploaded = (imageUrl: string, imagePath: string) => {
    setFormData(prev => ({ ...prev, imageUrl, imagePath }));
  };

  const handleImageRemoved = () => {
    setFormData(prev => ({ ...prev, imageUrl: null, imagePath: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get user session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        addNotification('Debes iniciar sesión para publicar', 'error');
        return;
      }

      const user = session.user;
      
      // Validate required data
      if (!serverId && !gameId) {
        addNotification('Error: No se puede determinar el destino del post', 'error');
        return;
      }
      
      // Use uploaded image URL if available
      const imageUrl = formData.imageUrl;

      // Create post data for Supabase
      const postData = {
        user_id: user.id,
        game_id: gameId,
        server_id: serverId || null,
        title: '', // Posts from form don't have titles
        content: formData.content,
        image_url: imageUrl,
        post_type: 'general' as const,
        is_active: true
      };

      // Insert post into Supabase
      const { data: newPost, error: insertError } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      // Reset form
      setFormData({ content: '', imageUrl: null, imagePath: null });
      setAuthorName('');
      
      // Reset image upload component
      imageUploadRef.current?.resetUpload();
      
      // Show success notification
      addNotification('Post publicado exitosamente', 'success');
      
      // Dispatch custom event to reload posts
      const event = new CustomEvent('postAdded', {
        detail: { serverId, gameId, post: newPost }
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
    <div className="glass-calico rounded-xl p-6 border border-calico-stripe-light/20 mb-8">
      <h2 className="text-xl font-bold text-calico-white mb-4">Comparte tu experiencia</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {showNameField && (
          <div>
            <input 
              type="text" 
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Tu nombre" 
              className="w-full px-4 py-2 bg-white/10 border border-calico-stripe-light/30 rounded-lg text-calico-white placeholder-calico-gray-400 focus:outline-none focus:border-calico-orange-500"
            />
          </div>
        )}
        
        <div>
          <textarea 
            value={formData.content}
            onChange={handleContentChange}
            placeholder={placeholder}
            className={`w-full bg-white/5 border rounded-lg p-4 text-calico-white placeholder-calico-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-calico-orange-500 ${
              errors.content ? 'border-red-500' : 'border-calico-stripe-light/30'
            }`}
            rows={3}
            disabled={isSubmitting}
          />
          {errors.content && <p className="text-calico-red-400 text-sm mt-1">{errors.content}</p>}
        </div>
        
        {/* Componente de subida de imágenes */}
        <PostImageUpload
          ref={imageUploadRef}
          onImageUploaded={handleImageUploaded}
          onImageRemoved={handleImageRemoved}
          disabled={isSubmitting}
          className="mb-4"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {formData.imageUrl && (
              <span className="text-sm text-calico-orange-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Imagen lista
              </span>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-calico-orange-600 hover:bg-calico-orange-700 disabled:bg-calico-gray-600 disabled:cursor-not-allowed text-calico-white px-6 py-2 rounded-lg transition-colors font-semibold"
          >
            {isSubmitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;