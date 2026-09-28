/**
 * BOSS Study OS — Lazy Monaco Editor Loader
 * Defers Monaco Editor script injection and bundle initialization until needed.
 * Guarantees idempotent loading, singleton Promise caching, and clean error handling.
 */

let _monacoPromise = null;
let _monacoEditorInstance = null;

const MonacoLoader = {
    isLoaded() {
        return !!(typeof window !== 'undefined' && window.monaco && window.monaco.editor);
    },

    loadMonaco() {
        if (typeof window === 'undefined') {
            return Promise.reject(new Error('Monaco can only be loaded in a browser environment'));
        }

        if (this.isLoaded()) {
            return Promise.resolve(window.monaco);
        }

        if (_monacoPromise) {
            return _monacoPromise;
        }

        _monacoPromise = new Promise((resolve, reject) => {
            const finishInit = () => {
                try {
                    if (typeof window.require !== 'undefined' && window.require.config) {
                        window.require.config({
                            paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
                        });
                        window.require(['vs/editor/editor.main'], function() {
                            window.monacoReady = true;
                            resolve(window.monaco);
                        }, function(err) {
                            _monacoPromise = null;
                            reject(err || new Error('Failed to load Monaco editor.main'));
                        });
                    } else {
                        _monacoPromise = null;
                        reject(new Error('Monaco loader require() is unavailable'));
                    }
                } catch (e) {
                    _monacoPromise = null;
                    reject(e);
                }
            };

            if (typeof window.require !== 'undefined' && typeof window.require.config === 'function') {
                finishInit();
                return;
            }

            if (typeof document === 'undefined') {
                _monacoPromise = null;
                reject(new Error('Document is not available'));
                return;
            }

            const existing = document.querySelector('script[src*="monaco-editor"][src*="loader.min.js"]');
            if (existing) {
                existing.addEventListener('load', finishInit);
                existing.addEventListener('error', () => {
                    _monacoPromise = null;
                    reject(new Error('Failed to load Monaco loader.min.js'));
                });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
            script.async = true;
            script.onload = finishInit;
            script.onerror = () => {
                _monacoPromise = null;
                reject(new Error('Failed to download Monaco loader from CDN'));
            };
            document.head.appendChild(script);
        });

        return _monacoPromise;
    },

    getEditor() {
        return _monacoEditorInstance;
    },

    setEditor(instance) {
        _monacoEditorInstance = instance;
    },

    disposeEditor() {
        if (_monacoEditorInstance) {
            try {
                _monacoEditorInstance.dispose();
            } catch (e) {}
            _monacoEditorInstance = null;
        }
    }
};

function loadMonaco() {
    return MonacoLoader.loadMonaco();
}

if (typeof window !== 'undefined') {
    window.MonacoLoader = MonacoLoader;
    window.loadMonaco = loadMonaco;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MonacoLoader, loadMonaco };
}
