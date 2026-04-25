export interface RemoteData {
	name: string;
	url: string;
	_url?: string;
	secondsOfDelay?: number;
	seamsColor?: string;
	hideLabel?: true;
	queryParam?: boolean;
}

export const config = {
    adminUrl: 'http://localhost:5174/',
	layoutUrl: 'http://localhost:5175/',
	loginUrl: 'http://localhost:5176/',
  };

export const proxy ={
    '/admin': {
      target: config.adminUrl,
      changeOrigin: true,
	//   rewrite: (path: string) => path.replace(/^\/admin/, ''),
    },
	'/login': {
      target: config.loginUrl,
      changeOrigin: true,
	//   rewrite: (path: string) => path.replace(/^\/admin/, ''),
    },
	'/layout': {
      target: config.layoutUrl,
      changeOrigin: true,
	//   rewrite: (path: string) => path.replace(/^\/admin/, ''),
    },
}

export const remotes: Record<string, RemoteData> = {
	admin: {
		name: 'admin',
		url: config.adminUrl,
		secondsOfDelay: 0,
		seamsColor: '#007d81',
	},
	login: {
		name: 'login',
		url: config.loginUrl,
		secondsOfDelay: 0,
		seamsColor: '#008686',
	},
	layout: {
		name: 'layout',
		url: config.layoutUrl,
		secondsOfDelay: 0,
		seamsColor: '#007d81',
	},
};