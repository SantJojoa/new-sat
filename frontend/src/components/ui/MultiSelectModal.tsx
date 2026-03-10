import { useState } from 'react';

interface MultiSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: { id: string; name: string }[];
    selectedItems: { id: string; name: string }[];
    onSave: (selected: { id: string; name: string }[]) => void;
    searchPlaceholder?: string;
    icon?: string;
    singleSelect?: boolean;
}

function MultiSelectModalContent({
    onClose,
    title,
    items,
    selectedItems,
    onSave,
    searchPlaceholder = 'Buscar...',
    icon = 'search',
    singleSelect = false,
}: Omit<MultiSelectModalProps, 'isOpen'>) {
    const [search, setSearch] = useState('');
    const [tempSelected, setTempSelected] = useState<{ id: string; name: string }[]>(() => [...selectedItems]);

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-zinc-200 animate-slideUp">
                <div className="p-6 border-b border-zinc-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 size-10 rounded-lg flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">{icon}</span>
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900">{title}</h3>
                        </div>
                        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors" type="button">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[20px]">
                            search
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full h-12 pl-10 pr-4 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 mt-3">
                        {!singleSelect && (
                            <>
                                <button
                                    onClick={() => setTempSelected(filteredItems)}
                                    className="text-xs font-semibold text-primary hover:underline"
                                    type="button"
                                >
                                    Seleccionar todos ({filteredItems.length})
                                </button>
                                <span className="text-zinc-300">|</span>
                            </>
                        )}
                        <button
                            onClick={() => setTempSelected([])}
                            className="text-xs font-semibold text-zinc-500 hover:underline"
                            type="button"
                        >
                            Limpiar seleccion
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-zinc-300 text-5xl mb-3">search_off</span>
                            <p className="text-zinc-500">No se encontraron resultados</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredItems.map((item) => {
                                const isSelected = tempSelected.some((current) => current.id === item.id);
                                return (
                                    <label
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-zinc-200 hover:border-primary/50 hover:bg-zinc-50'
                                            }`}
                                    >
                                        <input
                                            type={singleSelect ? 'radio' : 'checkbox'}
                                            checked={isSelected}
                                            onChange={() =>
                                                setTempSelected((prev) => {
                                                    const exists = prev.some((current) => current.id === item.id);
                                                    if (exists) {
                                                        return prev.filter((current) => current.id !== item.id);
                                                    }
                                                    return singleSelect ? [item] : [...prev, item];
                                                })
                                            }
                                            name={singleSelect ? 'singleSelectGroup' : undefined}
                                            className="rounded border-zinc-300 text-primary focus:ring-primary"
                                        />
                                        <span className={isSelected ? 'text-sm font-semibold text-zinc-900' : 'text-sm text-zinc-700'}>
                                            {item.name}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-zinc-200">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-zinc-600">
                            <span className="font-bold text-primary">{tempSelected.length}</span> seleccionados
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-100 transition-colors"
                            type="button"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                onSave(tempSelected);
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                            type="button"
                        >
                            <span className="material-symbols-outlined text-[20px]">check</span>
                            Aplicar seleccion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const MultiSelectModal = ({ isOpen, selectedItems, ...props }: MultiSelectModalProps) => {
    if (!isOpen) return null;

    const selectionKey = selectedItems.map((item) => item.id).sort().join('|');
    return <MultiSelectModalContent key={`${props.title}-${selectionKey}`} selectedItems={selectedItems} {...props} />;
};

export default MultiSelectModal;
