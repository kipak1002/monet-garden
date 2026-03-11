import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import Spinner from './Spinner';
import Icon from './Icon';
import Linkify from './Linkify';

interface ContactPageProps {
  isAdminMode?: boolean;
}

const ContactPage: React.FC<ContactPageProps> = ({ isAdminMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'Commission',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [contactInfo, setContactInfo] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      setIsLoadingInfo(true);
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'artistProfileInfo')
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        const info = data?.value || '';
        setContactInfo(info);
        setEditContactInfo(info);
      } catch (error) {
        console.error('Error fetching contact info:', error);
      } finally {
        setIsLoadingInfo(false);
      }
    };
    fetchContactInfo();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('필수 항목을 모두 입력해주세요. (Please fill in all required fields.)');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('inquiries')
        .insert([formData]);

      if (error) throw error;

      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        type: 'Commission',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('문의 제출 중 오류가 발생했습니다. (An error occurred while submitting your inquiry.)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveContactInfo = async () => {
    setIsSavingInfo(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'artistProfileInfo', value: editContactInfo }, { onConflict: 'key' });

      if (error) throw error;
      
      setContactInfo(editContactInfo);
      alert('연락처 정보가 저장되었습니다. (Contact info saved.)');
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingInfo(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Icon type="check" className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">감사합니다! (Thank you!)</h2>
        <p className="text-lg text-gray-600 mb-8">
          문의가 성공적으로 접수되었습니다. 곧 연락드리겠습니다.<br />
          (Your inquiry has been successfully submitted. We will contact you soon.)
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all font-medium"
        >
          다시 작성하기 (Write another)
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-8 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4 tracking-tight">CONTACT</h1>
          <p className="text-gray-500 font-serif italic">
            작품 제작, 전시, 협업 등 다양한 문의를 기다립니다.<br />
            (We look forward to your inquiries regarding commissions, exhibitions, collaborations, etc.)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 mb-16">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
              이름 (Name) *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
              이메일 (Email) *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-bold text-gray-700 mb-2">
              문의 유형 (Inquiry Type) *
            </label>
            <div className="relative">
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="Commission">제작 의뢰 (Commission)</option>
                <option value="Exhibition">전시 문의 (Exhibition)</option>
                <option value="Collaboration">협업 문의 (Collaboration)</option>
                <option value="Purchase">작품 구매 (Purchase)</option>
                <option value="Other">기타 (Other)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Icon type="chevron-down" className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">
              메시지 (Message) *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white resize-none"
              placeholder="How can we help you?"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all disabled:bg-gray-400 flex justify-center items-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="h-5 w-5" />
                  <span>제출 중... (Submitting...)</span>
                </>
              ) : (
                <span>문의 보내기 (Send Message)</span>
              )}
            </button>
          </div>
        </form>

        {/* Contact Info Section moved from About page */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          {isAdminMode ? (
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-bold text-gray-900">연락처 정보 관리 (Contact Info Management)</h3>
              <textarea
                value={editContactInfo}
                onChange={(e) => setEditContactInfo(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white"
                placeholder="인스타그램 링크, 이메일, 연락처 등 추가 정보를 입력하세요."
              />
              <button
                onClick={handleSaveContactInfo}
                disabled={isSavingInfo}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300 flex items-center gap-2"
              >
                {isSavingInfo ? <Spinner size="h-4 w-4" /> : '정보 저장 (Save Info)'}
              </button>
            </div>
          ) : (
            !isLoadingInfo && contactInfo && (
              <div className="animate-fade-in">
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">CONTACT US</h3>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed font-serif text-lg">
                  <Linkify text={contactInfo} />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
