import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Inquiry } from '../types';
import Spinner from './Spinner';
import Icon from './Icon';

const AdminInquiryPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 이 문의를 삭제하시겠습니까? (Are you sure you want to delete this inquiry?)')) return;

    try {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInquiries(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'Commission': return '제작 의뢰 (Commission)';
      case 'Exhibition': return '전시 문의 (Exhibition)';
      case 'Collaboration': return '협업 문의 (Collaboration)';
      case 'Purchase': return '작품 구매 (Purchase)';
      case 'Other': return '기타 (Other)';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-gray-900">문의 내역 관리 (Inquiry Management)</h2>
        <button 
          onClick={fetchInquiries}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
          title="새로고침"
        >
          <Icon type="refresh" className="w-6 h-6" />
        </button>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-20 text-center border-2 border-dashed border-gray-200">
          <Icon type="mail" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl text-gray-500 font-serif">접수된 문의가 없습니다. (No inquiries found.)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Icon type="user" className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{inquiry.name}</h3>
                    <p className="text-sm text-gray-500">{inquiry.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium uppercase tracking-wider">
                    {getTypeLabel(inquiry.type)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(inquiry.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-5 text-gray-700 whitespace-pre-wrap leading-relaxed font-serif">
                {inquiry.message}
              </div>

              <button
                onClick={() => handleDelete(inquiry.id)}
                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                title="삭제"
              >
                <Icon type="trash" className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminInquiryPage;
