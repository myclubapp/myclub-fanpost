import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const TemplateRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      navigate(`/profile/templates/edit/${id}`, { replace: true });
    }
  }, [id, navigate]);

  return null;
};
