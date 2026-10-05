import React, { useState, useEffect } from 'react';
import { getSmileDealsFromCustomObject } from '../utils/ghlApi';

interface SmileDeal {
  id: string;
  offer_id: string;
  deal_name: string;
  deal_description: string;
  deal_month: string;
  isdealactive: boolean;
  deal_expiry_date: string;
  deal_display_order: number;
  usage_month: string;
  deal_type: string;
}

interface SmileDealsSelectorProps {
  selectedDeals: string[];
  onDealSelect: (dealId: string, deal: SmileDeal, isSelected: boolean) => void;
  className?: string;
}

const SmileDealsSelector: React.FC<SmileDealsSelectorProps> = ({
  selectedDeals,
  onDealSelect,
  className = ""
}) => {
  const [deals, setDeals] = useState<SmileDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSmileDeals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getSmileDealsFromCustomObject();
        console.log("🚀 ~ fetchSmileDeals ~ response:", response)
        
        // Transform the API response to our SmileDeal interface
        const transformedDeals: SmileDeal[] = response.map((record: any) => ({
          id: record.id,
          offer_id: record.properties?.offer_id || '',
          deal_name: record.properties?.deal_name || '',
          deal_description: record.properties?.deal_description || '',
          deal_month: record.properties?.deal_month || '',
          isdealactive: record.properties?.isdealactive?.[0] === 'true',
          deal_expiry_date: record.properties?.deal_expiry_date || '',
          deal_display_order: record.properties?.deal_display_order || 0,
          usage_month: record.properties?.usage_month || '',
          deal_type: record.properties?.deal_type || ''
        }));

        // Filter only active deals and sort by display order
        const activeDeals = transformedDeals
          .filter(deal => deal.isdealactive)
          .sort((a, b) => a.deal_display_order - b.deal_display_order);

        setDeals(activeDeals);
      } catch (err) {
        console.error('Error fetching Smile Deals:', err);
        setError('Failed to load Smile Deals');
      } finally {
        setLoading(false);
      }
    };

    fetchSmileDeals();
  }, []);

  if (loading) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading Smile Deals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-gray-600">No active Smile Deals available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className} p-3 border border-gray-300 rounded-[7px]`}>
      <label className="block text-font font-medium text-gray-700 ">
        Select Smile Deals
      </label>
      
      <div className="grid gap-x-3 gap-y-1">
        {deals.map((deal) => {
          const isSelected = selectedDeals.includes(deal.id);
          return (
          <div
            key={deal.id}
            className={` rounded-lg cursor-pointer transition-all `}
            onClick={() => onDealSelect(deal.id, deal, !isSelected)}
          >
            <div className="flex items-start">
              <div className="flex items-start gap-3">
               <div className={`w-4 h-4 rounded-[2px] border-2 flex items-center justify-center mt-[6px] ${
                  isSelected
                    ? ' border-[#253E69] bg-[#253E69]'
                    : 'border-gray-300'
                }`}>
                 {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="!font-normal !text-gray-900 text-[16px] !m-0">
                    {deal.deal_name}
                  </p>
                  {/* {deal.deal_description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {deal.deal_description}
                    </p>
                  )} */}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      
      {selectedDeals.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ {selectedDeals.length} Smile Deal{selectedDeals.length > 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
};

export default SmileDealsSelector;
