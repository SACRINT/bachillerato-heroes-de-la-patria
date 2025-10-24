/**
 * WEBPACK CONFIGURATION - Bundle Optimization
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

const path = require('path');
const webpack = require('webpack'); // Import webpack for DefinePlugin
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Import HtmlWebpackPlugin
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    const shouldAnalyze = process.env.ANALYZE === 'true';

    return {
        mode: isProduction ? 'production' : 'development',
        entry: {
            // Bundles principales por sección
            main: './public/js/main.js',
            admin: './public/js/admin-dashboard.js',
            'parent-portal': './public/js/parent-portal.js',
            'job-portal': './public/js/job-portal.js',

            // Bundles de features específicas
            cms: './public/js/cms-manager.js',
            analytics: './public/js/advanced-analytics.js',
            calendar: './public/js/event-calendar.js',
            tinymce: './public/js/tinymce-config.js', // Nuevo punto de entrada para TinyMCE

            // Vendors (libraries externas) - comentado temporalmente
            // vendor: [
            //     'chart.js',
            //     'moment',
            //     // Agregar otras libraries grandes aquí
            // ]
        },

        output: {
            filename: isProduction ? '[name].[contenthash].bundle.js' : '[name].bundle.js',
            path: path.resolve(__dirname, 'public', 'dist'),
            clean: true, // Limpia dist/ antes de cada build
            publicPath: '/dist/'
        },

        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: isProduction, // Elimina console.log en producción
                            drop_debugger: true,
                            pure_funcs: isProduction ? ['console.log', 'console.info'] : []
                        },
                        format: {
                            comments: false // Elimina comentarios
                        }
                    },
                    extractComments: false
                })
            ],

            // Code Splitting
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    // Separar vendors en bundle propio
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        priority: 10
                    },

                    // Código común entre bundles
                    common: {
                        minChunks: 2,
                        priority: 5,
                        reuseExistingChunk: true,
                        name: 'common'
                    },

                    // Libraries de charts
                    charts: {
                        test: /[\\/]node_modules[\\/](chart\.js|chartjs-.*)/,
                        name: 'charts',
                        priority: 15
                    },

                    // CSS común
                    styles: {
                        name: 'styles',
                        test: /\.css$/,
                        chunks: 'all',
                        enforce: true
                    }
                }
            },

            // Runtime chunk separado
            runtimeChunk: 'single',

            // Module IDs determinísticos para mejor caching
            moduleIds: 'deterministic'
        },

        module: {
            rules: [
                // JavaScript/ES6+
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    targets: {
                                        browsers: ['last 2 versions', 'ie >= 11']
                                    },
                                    modules: false,
                                    useBuiltIns: 'usage',
                                    corejs: 3
                                }]
                            ],
                            plugins: [
                                // Tree shaking optimization desactivado temporalmente
                                // '@babel/plugin-transform-runtime'
                            ]
                        }
                    }
                },

                // CSS
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader', 'postcss-loader']
                },

                // Images
                {
                    test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: 8 * 1024 // 8kb - inline si es menor
                        }
                    },
                    generator: {
                        filename: 'images/[name].[hash][ext]'
                    }
                },

                // Fonts
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name].[hash][ext]'
                    }
                }
            ]
        },

        plugins: [
            new HtmlWebpackPlugin({
                template: './public/admin-dashboard.html', // Source HTML file
                filename: 'admin-dashboard.html', // Output HTML file
                inject: 'body', // Inject scripts into the body
                chunks: ['main', 'admin', 'tinymce', 'calendar', 'vendors', 'common', 'charts', 'styles'], // Inyectar todos los bundles relevantes
                TINYMCE_API_KEY: process.env.TINYMCE_API_KEY || 'no-api-key', // Pass env var to template
            }),
            new webpack.DefinePlugin({
                'window.TINYMCE_API_KEY': JSON.stringify(process.env.TINYMCE_API_KEY || 'no-api-key'),
            }),
            // Compression con gzip
            ...(isProduction ? [
                new CompressionPlugin({
                    filename: '[path][base].gz',
                    algorithm: 'gzip',
                    test: /\.(js|css|html|svg)$/,
                    threshold: 10240, // Solo archivos > 10kb
                    minRatio: 0.8
                }),
                // Compression con brotli (mejor que gzip)
                new CompressionPlugin({
                    filename: '[path][base].br',
                    algorithm: 'brotliCompress',
                    test: /\.(js|css|html|svg)$/,
                    compressionOptions: {
                        level: 11
                    },
                    threshold: 10240,
                    minRatio: 0.8
                })
            ] : []),

            // Bundle analyzer (solo si ANALYZE=true)
            ...(shouldAnalyze ? [
                new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    reportFilename: 'bundle-report.html',
                    openAnalyzer: true,
                    generateStatsFile: true,
                    statsFilename: 'bundle-stats.json'
                })
            ] : [])
        ],

        performance: {
            hints: isProduction ? 'warning' : false,
            maxEntrypointSize: 250000, // 250kb
            maxAssetSize: 250000
        },

        devtool: isProduction ? 'source-map' : 'eval-source-map',

        stats: {
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false
        }
    };
};
