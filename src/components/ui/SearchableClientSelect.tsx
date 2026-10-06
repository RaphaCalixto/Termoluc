import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Building2, User, Phone, MapPin, Plus, UserCheck } from 'lucide-react';
import { Client } from '../../types';

interface SearchableClientSelectProps {
  clients: Client[];
  selectedClientId?: string;
  selectedClientIds?: string[];
  onSelectClient?: (clientId: string) => void;
  onSelectClientIds?: (clientIds: string[]) => void;
  isMulti?: boolean;
  required?: boolean;
  disabled?: boolean;
  labelPlaceholder?: string;
}

export const SearchableClientSelect: React.FC<SearchableClientSelectProps> = ({
  clients,
  selectedClientId = '',
  selectedClientIds = [],
  onSelectClient,
  onSelectClientIds,
  isMulti = false,
  required = false,
  disabled = false,
  labelPlaceholder = 'Buscar e vincular cliente(s)...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize selected IDs
  const currentSelectedIds: string[] = isMulti
    ? selectedClientIds
    : selectedClientId ? [selectedClientId] : [];

  const selectedClientObjects = clients.filter(c => currentSelectedIds.includes(c.id));

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredClients = clients.filter(c => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = c.name.toLowerCase().includes(query);
    const docMatch = c.document?.toLowerCase().includes(query);
    const phoneMatch = c.phone.toLowerCase().includes(query);
    const addressMatch = c.address.toLowerCase().includes(query);
    const emailMatch = c.email?.toLowerCase().includes(query);
    return nameMatch || docMatch || phoneMatch || addressMatch || emailMatch;
  });

  const handleToggleClient = (clientId: string) => {
    if (isMulti) {
      let updated: string[];
      if (currentSelectedIds.includes(clientId)) {
        updated = currentSelectedIds.filter(id => id !== clientId);
      } else {
        updated = [...currentSelectedIds, clientId];
      }
      if (onSelectClientIds) onSelectClientIds(updated);
      if (onSelectClient) onSelectClient(updated[0] || '');
      // Keep dropdown open in multi-select for smooth batch selection
    } else {
      if (onSelectClient) onSelectClient(clientId);
      if (onSelectClientIds) onSelectClientIds([clientId]);
      setIsOpen(false);
    }
  };

  const handleRemoveClient = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMulti) {
      const updated = currentSelectedIds.filter(id => id !== clientId);
      if (onSelectClientIds) onSelectClientIds(updated);
      if (onSelectClient) onSelectClient(updated[0] || '');
    } else {
      if (onSelectClient) onSelectClient('');
      if (onSelectClientIds) onSelectClientIds([]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Hidden input to maintain native required form validation */}
      {required && (
        <input
          type="text"
          value={currentSelectedIds.join(',')}
          onChange={() => {}}
          required={required}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Selected Chips in Multi-Select Mode */}
      {isMulti && selectedClientObjects.length > 0 && (
        <div className="space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
            <span className="flex items-center gap-1 text-termoluc-700">
              <UserCheck className="w-3.5 h-3.5 text-termoluc-600" />
              {selectedClientObjects.length} {selectedClientObjects.length === 1 ? 'Cliente vinculado' : 'Clientes vinculados (Casal / Sócios)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedClientObjects.map((client, idx) => (
              <div
                key={client.id}
                className="p-2.5 rounded-xl bg-termoluc-50/80 border border-termoluc-200 text-xs flex items-center justify-between gap-2 shadow-2xs group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-termoluc-600 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 truncate block">
                      {client.name}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {client.phone} {client.document ? `• ${client.document}` : ''}
                    </span>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveClient(client.id, e)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                    title="Desvincular cliente"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 bg-white ${
          isOpen
            ? 'border-termoluc-500 ring-2 ring-termoluc-200'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
      >
        {!isMulti && selectedClientObjects.length === 1 ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-termoluc-50 border border-termoluc-200 text-termoluc-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
              {selectedClientObjects[0].image_url ? (
                <img
                  src={selectedClientObjects[0].image_url}
                  alt={selectedClientObjects[0].name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="w-4 h-4 text-termoluc-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-slate-900 text-sm truncate block leading-tight">
                {selectedClientObjects[0].name}
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                {selectedClientObjects[0].document ? `${selectedClientObjects[0].document} • ` : ''}
                {selectedClientObjects[0].phone}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm">
            {isMulti && selectedClientObjects.length > 0 ? (
              <Plus className="w-4 h-4 text-termoluc-600" />
            ) : (
              <Search className="w-4 h-4 text-slate-400" />
            )}
            <span className={isMulti && selectedClientObjects.length > 0 ? 'text-termoluc-700 font-semibold' : 'text-slate-400'}>
              {isMulti && selectedClientObjects.length > 0
                ? '+ Vincular mais um cliente (ex: Cônjuge / Sócio)...'
                : labelPlaceholder}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          {!isMulti && selectedClientObjects.length === 1 && !disabled && (
            <button
              type="button"
              onClick={(e) => handleRemoveClient(selectedClientObjects[0].id, e)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-md transition-colors"
              title="Limpar seleção"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-termoluc-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu with Search */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
          {/* Search Header */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-termoluc-600 ml-1 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Digite o nome, CPF/CNPJ, telefone ou endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400 py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const isSelected = currentSelectedIds.includes(client.id);
                return (
                  <div
                    key={client.id}
                    onClick={() => handleToggleClient(client.id)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-termoluc-50 text-termoluc-900 font-semibold border border-termoluc-200/60'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          isSelected
                            ? 'bg-termoluc-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {client.image_url ? (
                          <img
                            src={client.image_url}
                            alt={client.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {client.name}
                          </span>
                          {client.document && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                              {client.document}
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-[10px] bg-termoluc-600 text-white font-bold px-1.5 py-0.5 rounded-md">
                              Vinculado
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {client.phone}
                          </span>
                          <span className="flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {client.address}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-termoluc-600 border-termoluc-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center px-4">
                <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Nenhum cliente encontrado
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tente buscar por outro termo ou nome.
                </p>
              </div>
            )}
          </div>

          {/* Footer with total count & close button */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              {currentSelectedIds.length > 0
                ? `Selecionado(s): ${currentSelectedIds.length} cliente(s)`
                : `Total: ${clients.length} clientes`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-termoluc-600 hover:bg-termoluc-700 rounded-lg transition-colors"
            >
              Concluir Seleção
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
