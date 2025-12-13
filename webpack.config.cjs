/**
 * 📦 WEBPACK CONFIGURATION - CODE SPLITTING & OPTIMIZATION
 *
 * Divide el bundle de 7.1MB en chunks optimizados:
 * - Vendors (libraries externas)
 * - Common (código compartido)
 * - Page-specific chunks
 *
 * Semana 3 - Tarea 2: Code Splitting
 * Fecha: 17 Noviembre 2025
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// ============================================
// CONFIGURACIÓN
// ============================================

const isProduction = process.env.NODE_ENV === 'production';
const enableAnalyzer = process.env.ANALYZE === 'true';

module.exports = {
    mode: isProduction ? 'production' : 'development',

    // Entry points por página crítica
    entry: {
        // Core (usado en todas las páginas)
        core: './public/js/main.js',

        // Admin dashboard (archivo más grande - 143KB)
        'admin-dashboard': './public/js/dashboard-manager-2025.js',
        'admin-auth': './public/js/admin-auth.js',

        // Security modules (93KB)
        'security': './public/js/bge-security-module.js',

        // Forms y validation
        'forms': './public/js/professional-forms.js',
        // 'validator': './public/js/form-validator.js', // Migrado a TypeScript bundle

        // Chatbot (73KB)
        'chatbot': './public/js/chatbot.js',

        // Student portal
        'student-dashboard': './public/js/student-dashboard.js',
        'student-auth': './public/js/student-auth.js',

        // Parent portal
        'parent-portal': './public/js/parent-portal.js',

        // Teachers portal
        'teachers-portal': './public/js/teachers-portal-manager.js',

        // Calendar
        'calendar': './public/js/interactive-calendar.js',

        // Virtual scrolling (performance)
        'virtual-scrolling': './public/js/virtual-scrolling.js'
    },

    output: {
        path: path.resolve(__dirname, 'dist/js'),
        filename: '[name].[contenthash:8].js', // Cache busting
        chunkFilename: '[name].[contenthash:8].chunk.js',
        clean: true, // Limpiar dist antes de build
        publicPath: '/dist/js/'
    },

    // ============================================
    // OPTIMIZATION - CODE SPLITTING
    // ============================================

    optimization: {
        minimize: isProduction,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: isProduction, // Eliminar console.log en producción
                        drop_debugger: true,
                        pure_funcs: isProduction ? ['console.log', 'console.info', 'debugLog.log'] : []
                    },
                    mangle: true,
                    format: {
                        comments: false // Eliminar comentarios
                    }
                },
                extractComments: false
            })
        ],

        // Split chunks strategy
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                // Vendors: Libraries externas (Chart.js, Bootstrap, etc)
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: 20,
                    reuseExistingChunk: true
                },

                // Common: Código compartido entre 2+ páginas
                common: {
                    minChunks: 2,
                    name: 'common',
                    priority: 10,
                    reuseExistingChunk: true,
                    enforce: true
                },

                // Admin: Todo el código del dashboard admin
                admin: {
                    test: /[\\/]js[\\/](admin|dashboard)/,
                    name: 'admin-bundle',
                    priority: 15,
                    minChunks: 1,
                    reuseExistingChunk: true
                },

                // Student: Portal de estudiantes
                student: {
                    test: /[\\/]js[\\/]student/,
                    name: 'student-bundle',
                    priority: 15,
                    minChunks: 1,
                    reuseExistingChunk: true
                },

                // Security: Módulos de seguridad
                security: {
                    test: /[\\/]js[\\/](security|auth)/,
                    name: 'security-bundle',
                    priority: 15,
                    minChunks: 1,
                    reuseExistingChunk: true
                }
            },

            // Configuración de tamaños
            maxSize: 244 * 1024, // 244KB máximo por chunk
            minSize: 20 * 1024, // 20KB mínimo para crear chunk
            maxAsyncRequests: 30, // Máximo 30 requests paralelos
            maxInitialRequests: 30 // Máximo 30 requests iniciales
        },

        // Runtime chunk separado (mejora caching)
        runtimeChunk: {
            name: 'runtime'
        },

        // Module IDs determinísticos (mejor caching)
        moduleIds: 'deterministic'
    },

    // ============================================
    // MODULE RULES - BABEL TRANSPILATION
    // ============================================

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    browsers: ['last 2 versions', 'not dead', 'not ie <= 11']
                                },
                                modules: false, // Webpack maneja modules
                                useBuiltIns: 'usage',
                                corejs: 3
                            }]
                        ],
                        plugins: [
                            '@babel/plugin-transform-runtime'
                        ],
                        cacheDirectory: true // Cache para builds más rápidos
                    }
                }
            }
        ]
    },

    // ============================================
    // PLUGINS
    // ============================================

    plugins: [
        // Compression: Gzip + Brotli
        new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240, // Solo archivos > 10KB
            minRatio: 0.8
        }),

        new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            compressionOptions: {
                level: 11 // Máxima compresión
            },
            threshold: 10240,
            minRatio: 0.8
        }),

        // Bundle Analyzer (solo si ANALYZE=true)
        ...(enableAnalyzer ? [
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                reportFilename: path.resolve(__dirname, 'docs/bundle-analysis.html'),
                openAnalyzer: false,
                generateStatsFile: true,
                statsFilename: path.resolve(__dirname, 'docs/bundle-stats.json')
            })
        ] : [])
    ],

    // ============================================
    // PERFORMANCE HINTS
    // ============================================

    performance: {
        hints: isProduction ? 'warning' : false,
        maxEntrypointSize: 512 * 1024, // 512KB warning
        maxAssetSize: 512 * 1024 // 512KB warning
    },

    // ============================================
    // DEVELOPMENT
    // ============================================

    devtool: isProduction ? 'source-map' : 'eval-source-map',

    stats: {
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
        entrypoints: true,
        warnings: true,
        errors: true,
        errorDetails: true
    },

    // ============================================
    // RESOLVE
    // ============================================

    resolve: {
        extensions: ['.js', '.mjs'],
        alias: {
            '@js': path.resolve(__dirname, 'public/js'),
            '@css': path.resolve(__dirname, 'public/css'),
            '@assets': path.resolve(__dirname, 'public/assets')
        }
    }
};
