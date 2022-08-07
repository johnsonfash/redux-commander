const { program } = require('commander');
const fs = require('fs');
const path = require('path');

const jsxBoilerPlateImport = (name, distance, server) => {
  return `
import React, { useEffect, useRef, useState } from "react";
import def from "${distance}services/enum";
import Loading from "${distance}components/loading";
import { goodToken } from "${distance}services/token";
import { notEmpty, empty } from "${distance}services/objCheck";
import { all${name.mid}Dispatch } from "${distance}store/actions/account";
import { graphql } from "${distance}services/axiosAuth";
// import { request${name.mid}Data } from "${distance}store/graphql/account";
import { toast, ToastContainer } from "react-toastify";
import { FormClear, FormHandler } from "${distance}services/form";
import { useDispatch, useSelector } from "react-redux";
${server ? 'import { wrapper } from "${distance}store"' : ''};
  `
}


const jsxBoilerPlateHooks = (name, filename) => {
  return `
function ${filename.mid}() {
  const [loading, setLoading] = useState(false);
  const [${name.small}, set${name.mid}] = useState({});
  const mounted = useRef(null);
  const http = useDispatch();
  const ${name.small}Redux = useSelector((state) => state.${name.small}Data);
  `;
}

const jsxBoilerPlateUseEffect = (name) => {
  return `
  useEffect(() => {
    if (!mounted.current) {
      if (empty(${name.small}Redux.data)) {
        // http(graphql(request${name.mid}Data, {}, all${name.mid}Dispatch));
      } else {
        setLoading(false);
        if (${name.small}Redux.error) {
          toast.error(${name.small}Redux.errorMessage, { autoClose: 1000, theme: "colored" });
        } else {
          const data = ${name.small}Redux.data[Object.keys(${name.small}Redux.data)[0]];
          set${name.mid}(data);
        }
      }
      mounted.current = true;
    } else {
      if (${name.small}Redux.loading === def.DONE) {
        setLoading(false);
        if (${name.small}Redux.error) {
          toast.error(${name.small}Redux.errorMessage, { theme: "colored" });
        } else {
          const data = ${name.small}Redux.data[Object.keys(${name.small}Redux.data)[0]];
          set${name.mid}(data);
        }
      }
    }
  }, [${name.small}Redux.data]);
  `
}

const jsxBoilerPlateForm = (name, formArray = []) => {
  return `
  const handleSubmit = (e) => {
    const data = FormHandler(e, ${JSON.stringify(formArray)});
    // http(graphql(request${name.mid}Data, data, all${name.mid}Dispatch));
    setLoading(true);
  };
  `;
}
const jsxBoilerPlateRender = (filename) => {
  return `
  return loading ? <Loading /> : <div className="${filename.small}">${filename.mid}</div>;
}
  `;
}

const jsxBoilerPlateServer = () => {
  return `
  export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
      async ({ req, res }) => {
        const isGood = await goodToken(req, res);
        if (!isGood) {
          return {
            redirect: {
              permanent: false,
              destination: "/home",
            },
            props: {},
          };
        } else {
          return {
            props: {}
          }
        }
      }
  );
  `;
}

const jsxBoilerPlateExport = (name) => {
  return `
export default ${name.mid};
  `;
}

const routing = (file, dot) => `
import React from 'react';
import { Provider } from 'react-redux';
import store from '${dot}store';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '${dot}pages/index';

function ${file}() {
  return (
    <Provider store={store} >
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </Router>
    </Provider>
  )
}

export default ${file};
  `;


const storeIndexPathOne = (type) => `
import { legacy_createStore as createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
${type == 'nextjs' ? "import { createWrapper, HYDRATE } from 'next-redux-wrapper';" : ''}
  `;

const storeIndexPathTwo = () => `
const appReducer = combineReducers({
`;
const storeIndexPathThree = (type) => `
});

${type == 'react' ? `
const rootReducer = (state, action) => {
  if (action.type === 'RESET_APP') {
    state = undefined;
  }
  return appReducer(state, action);
};
`:
    `const rootReducer = (state, action) => {
  switch (action.type) {
    case 'RESET_APP':
      state = undefined;
      break;
    case HYDRATE:
    default:
      return { ...state };
  }
  return appReducer(state, action);
};
`}

const middleware = compose(applyMiddleware(thunkMiddleware));
${type == 'react' ? `
const store = createStore(rootReducer, middleware);
export default store;
`
    :
    `const makeStore = (context) => createStore(rootReducer, middleware);
export const wrapper = createWrapper(makeStore, { debug: false });
`}
`;

const actionSample = (name) => {
  name = stringTrans(name);
  return `
import def from "../../services/enum";
export const ${name.small}DataRequest = () => ({ type: def.${name.big}_DATA_REQUEST });
export const ${name.small}DataSuccess = (${name.small}Data) => ({ type: def.${name.big}_DATA_SUCCESS, payload: ${name.small}Data });
export const ${name.small}DataFailure = (error) => ({ type: def.${name.big}_DATA_FAILURE, payload: error });

export const reset${name.mid}Data = () => async (dispatch) => {
  dispatch({ type: def.RESET_${name.big}_DATA });
  }

export const ${name.small}Available = (data) => async (dispatch) => {
  dispatch(${name.small}DataSuccess(data));
}

export const all${name.mid}Dispatch = [${name.small}DataRequest, ${name.small}DataSuccess, ${name.small}DataFailure];
`
};

const reducerSample = (name) => {
  name = stringTrans(name);
  return `
import def from "../../services/enum";

const initialState = {
  loading: def.FALSE,
  accountData: [],
  error: false,
  errorMessage: ''
};

const ${name.small}Data = (state = initialState, action) => {
  switch (action.type) {
    case def.${name.big}_DATA_REQUEST:
      return {
        ...state,
        loading: def.TRUE
      };
    case def.${name.big}_DATA_SUCCESS:
      return {
        error: false,
        errorMessage: '',
        ${name.small}Data: action.payload,
        loading: def.DONE
     };
    case def.${name.big}__DATA_FAILURE:
      return {
        ...state,
        loading: def.DONE,
        error: true,
        errorMessage: action.payload
      };
      default:
      return state;
  }
};
export default ${name.small}Data;
`;
}

const formFile = `
import { toast } from "react-toastify";

/**
 * @param  {} sample FormHandler(e, ["email", "phone"], {rename: ["email", "phone"], to: "phoneNumberOrEmail"})
 */
export const FormHandler = (event, fieldsArray = [], changes = false, files = false) => {
  event?.preventDefault();
  const obj = {};
  for (let i = 0; i < fieldsArray.length; i++) {
    try {
      const value = event?.target[fieldsArray[i]]?.value;
      if (value) {
        if (changes && changes.rename.includes(fieldsArray[i])) {
          obj[changes.to] = value;
        } else {
          if (fieldsArray[i] === 'dateOfBirth') {
            obj[fieldsArray[i]] = new Date(value).toISOString();
          } else {
            if (files && files.includes(fieldsArray[i])) {
              obj[fieldsArray[i]] = event?.target[fieldsArray[i]]?.files[0];
            } else {
              obj[fieldsArray[i]] = value;
            }
          }
        }
      }
    } catch (error) { }
  }
  return obj;
}

export const FormClear = (event, fieldsArray) => {
  event?.preventDefault();
  for (let i = 0; i < fieldsArray.length; i++) {
    try {
      event.target[fieldsArray[i]].value = '';
    } catch (error) { }
  }
}

export const FormError = (obj) => {
  return { [obj.errorType === 'UserInputError' ? "mobile" : obj.errorType]: { error: true, errorMessage: obj.errorType === 'UserInputError' ? "check form fields for invalid input" : obj.errorMessage } }
}

export const isSafari = (e) => {
  try {
    e.target.setCustomValidity("");
  } catch (error) { }
};

export const isInvalid = (e) => {
  try {
    e.target.setCustomValidity(e.target.title);
  } catch (error) { }
};

export const copyText = async (data) => {
  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(data);
    }
  } catch (error) {
    prompt("Copy to clipboard: Ctrl+C, Enter", data);
  }
  toast.success("INVITE CODE COPYED!", {
    autoClose: 500,
    theme: "colored",
    hideProgressBar: true,
  });
};

export const shareLink = async (invitee) => {
  const url = 'https://example.com/invite&user=\${invitee}';
  try {
    navigator.share({
      url,
      text: "Hi friend",
      title: "Hi friend",
    });
  } catch (error) {
    window.open(
      \`https://api.whatsapp.com/send?text=\${encodeURIComponent(
        \`Hi friend, earn amazing cashback in your wallet when you register using my invite link on Betascratch \n\${url}\`
      )}\`,
      "_blank"
    );
  }
};
`;

const objFile = `
export const notEmpty = (data) => {
  try {
    if (Array.isArray(data)) {
      return data.length ? true : false;
    } else if (data !== null && typeof data === 'object') {
      return Object.keys(data).length > 0;
    } else {
      return false;
    }
  } catch (e) { }
  return false;
}

export const empty = (data) => {
  return !notEmpty(data);
}

export const dateConvert = (dateString) => {
  const event = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric', hour: "numeric", minute: "numeric" };
  return event.toLocaleDateString(undefined, options);
}
`;

const enumFile = `
import { getAccessToken, getRefreshToken } from "./token";

const def = Object.freeze({
  DONE: 'done',
  TRUE: 'true',
  FALSE: 'false',
  GRAPHQL_URL: '',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  FETCH_API_DEFAULT: {
    method: 'post',
    headers: {
      "Content-type": "application/json",
    }
  },
  NEW_ACCESS_TOKEN: () => {
    return {
      method: 'POST',
      headers: {
        "Content-type": "application/json",
        "Authorization": \`Bearer \${getRefreshToken()}\`,
      }
    };
  },
  UPLOAD_AUTH: () => {
    return {
      method: 'POST',
      headers: {
        "Authorization": \`Bearer \${getAccessToken()}\`,
      }
    };
  },
  DEFAULT_WITH_AUTH: () => {
    return {
      method: 'POST',
      headers: {
        "Content-type": "application/json",
        "Authorization": \`Bearer \${ getAccessToken()}\`,
      }
    };
  },
});
export default def;
`;

const axiosFile = `
import def from './enum';
import { cookiesFromHead } from './token';



/**
 * 
 * @param query: graphql { users { id name, email, ...rest}}
 * @param variables: {email: e.email, password: e.password, ...rest} 
 * @param [dispatch] : Function
 * @param url : String
 */

export const graphqlServer = async (query = false, variables = {}) => {
  try {
    const response = await fetch(def.GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      }
      , body: JSON.stringify({ query, variables })
    });
    const data = await response.json();
    if (data.errors) {
      return { error: true, errorMessage: data?.errors[0]?.error?.message };
    } else {
      return { error: false, data: data?.data[Object.keys(data?.data)[0]] }
    }
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * 
 * @param query: query { users { id name, email, ...rest}} : String
 * @param variables: {email: e.email, password: e.password, ...rest}: Object 
 * @param [dispatch] : [Function]: Array
 * @param url : String
 */

export const graphql = (query = '', variables = {},
  dispatches = false,
  url = def.GRAPHQL_URL
) => async (dispatch) => {
  try {
    dispatches && dispatch(dispatches[0]());
    let response = await fetch(url, { ...def.FETCH_API_DEFAULT, body: JSON.stringify({ query, variables }) })
    await cookiesFromHead(response)
    response = await response.json();
    // console.log(response)
    if (response.errors) {
      const errObj = { error: true, errorType: response.errors[0]?.error?.response?.name || response.errors[0]?.error?.name || response.errors[0]?.name, errorMessage: response.errors[0]?.error?.message || response.errors[0]?.message };
      if (dispatch) {
        dispatch(dispatches[2](errObj))
      } else {
        return errObj;
      }
    } else {
      if (dispatch) {
        dispatch(dispatches[1](response.data))
        // dispatch(dispatches[1](response.data[Object.keys(response.data)[0]]))
      } else {
        return { error: false, data: response.data }
      }
    }
  } catch (error) {
    console.log(error.message)
    const errorObj = { error: true, errorType: 'request', errorMessage: error.message };
    if (dispatches) {
      dispatch(dispatches[2](errorObj));
    } else {
      return errorObj;
    }
  }
};
`;

const  axiosAuthFile = `
import def from './enum';
import Cookies from 'js-cookie';
import jwtDecode from "jwt-decode";
import { accessToken } from '../store/graphql/onboading';
import { cookiesFromHead } from './token';

export const checkCookieStatus = async () => {
  const errorObj = { error: true, message: 'invalid_token' };
  const token = Cookies.get();
  if (!token[def.REFRESH_TOKEN]) {
    throw errorObj;
  }
  let expired = true;
  const access_token = token[def.ACCESS_TOKEN];
  if (access_token) {
    expired = Date.now >= (jwtDecode(access_token).exp * 1000);
  }
  if (expired) {
    try {
      let token = await fetch(def.GRAPHQL_URL, { ...def.FETCH_API_DEFAULT, body: JSON.stringify({ query: accessToken }) });
      const cookies = token;
      token = await token.json();
      if (token?.data?.generateAccessToken) {
        await cookiesFromHead(cookies)
        return true;
      }
      else {
        throw errorObj;
      }
    } catch (error) {
      throw errorObj;
    }
  }
  return true;
}

/**
 * 
 * @param query: graphql { users { id name, email, ...rest}}
 * @param variables: {email: e.email, password: e.password, ...rest} 
 * @param [dispatch] : Function
 * @param url : String
 */

export const graphqlServer = async (req, res, query = false, variables = {}, setToken = true) => {
  try {
    const { access_token } = req.cookies
    const response = await fetch(def.GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        "Authorization": \`Bearer \${access_token}\`,
      }
      , body: JSON.stringify({ query, variables })
    });
    const data = await response.json();
    if (data.errors) {
      return { error: true, errorMessage: data?.errors[0] };
    } else {
      return { error: false, data: data?.data[Object.keys(data?.data)[0]] }
    }
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

export const graphql = (query = false, variables = {},
  // dispatches = false, token = null,
  dispatches = false, tData = {},
  url = def.GRAPHQL_URL) => async (dispatch) => {
    try {
      // if (token === null) {
      //   token = await checkCookieStatus();
      // }
      // if (token) {
      dispatches && dispatch(dispatches[0](tData));
      let response = await fetch(url, { ...def.DEFAULT_WITH_AUTH(), body: JSON.stringify({ query, variables }) });
      await cookiesFromHead(response);
      response = await response.json();
      console.log(response)
      if (response.errors) {
        const errObj = { error: true, errorMessage: response.errors[0].error.message };
        if (dispatch) {
          dispatch(dispatches[2](errObj))
        } else {
          return errObj;
        }
      } else {
        if (dispatch) {
          dispatch(dispatches[1](response.data))
          // dispatch(dispatches[1](response.data[Object.keys(response.data)[0]]))
        } else {
          return { error: false, data: response.data }
        }
      }
      // }
    } catch (error) {
      if (error.message === 'invalid_token') {
        Cookies.remove(def.ACCESS_TOKEN);
        Cookies.remove(def.REFRESH_TOKEN);
        // Router.replace('/?login');
        window.location.href = def.LOGIN_ROUTE;
      }
      const errorObj = { error: true, errorMessage: error.message };
      if (dispatches) {
        dispatch(dispatches[2](errorObj));
      } else {
        return errorObj;
      }
    }
  };
`;

const onboardingFile = `
export const accessToken = \`
query {
  generateAccessToken
}
\`;
`;

const tokenFile = `
import Cookies from 'js-cookie';
import def from './enum';
import jwtDecode from "jwt-decode";
import { accessToken } from '../store/graphql/onboarding';

export const getAccessToken = () => {
  try {
    const token = Cookies.get();
    return token[def.ACCESS_TOKEN] || '';
  } catch (error) {
    return '';
  }
}

export const getRefreshToken = () => {
  try {
    const token = Cookies.get();
    return token[def.REFRESH_TOKEN] || '';
  } catch (error) {
    return '';
  }
}

export const logOut = () => {
  if (confirm("Are you sure you want to logout?")) {
    Cookies.remove(def.ACCESS_TOKEN)
    Cookies.remove(def.REFRESH_TOKEN);
    window.location.href = '/login';
  }
}

export const cookiesFromHead = async (response, res = null, makeNull = false) => {
  try {
    let access_token;
    let refresh_token;
    if (response.headers.get) {
      access_token = response.headers.get(def.ACCESS_TOKEN);
      refresh_token = response.headers.get(def.REFRESH_TOKEN);
    } else {
      access_token = response.headers[def.ACCESS_TOKEN];
      refresh_token = response.headers[def.REFRESH_TOKEN];
    }
    if (res === null) {
      if (access_token) {
        Cookies.set(def.ACCESS_TOKEN, access_token, { expires: 1 / 96 });
      }
      if (refresh_token) {
        Cookies.set(def.REFRESH_TOKEN, refresh_token, { expires: 15 });
      }
    } else {
      const date = new Date();
      const time0m = new Date(date.getTime() + 0.1 * 60000).toUTCString();
      const time15m = new Date(date.getTime() + 15 * 60000).toUTCString();
      const time15d = new Date(date.setDate(date.getDate() + 15)).toUTCString();
      if (makeNull) {
        if (res.setHeader) {
          const c = res.setHeader('Set-Cookie',
            ['access_token=; Expires=\${time0m}',
            'refresh_token=; Expires=\${time0m}']);
        } else if (res.cookie) {
          res.clearCookie(def.ACCESS_TOKEN);
          res.clearCookie(def.REFRESH_TOKEN);
        }
      } else {
        if (access_token && !refresh_token) {
          if (res.setHeader) {
            const all = res.setHeader('Set-Cookie',
              ['access_token=\${access_token}; Expires=\${time15m}']);
          } else if (res.cookie) {
            const a = res.cookie(def.ACCESS_TOKEN, access_token, {
              maxAge: 1000 * 60 * 15
            })
          }
        } else {
          if (res.setHeader) {
            const b = res.setHeader('Set-Cookie',
              ['access_token=\${access_token}; Expires=\${time15m}',
              'refresh_token=\${refresh_token}; Expires=\${time15d}']);
          } else if (res.cookie) {
            const acc = res.cookie(def.ACCESS_TOKEN, access_token, {
              maxAge: 1000 * 60 * 15,
            })
            const ref = res.cookie(def.REFRESH_TOKEN, refresh_token, {
              maxAge: 1000 * 60 * 60 * 24 * 15
            })
          }
        }
      }
    }
  } catch (error) {
    if (res !== null) {
      const date = new Date();
      const time0m = new Date(date.getTime() + 0.1 * 60000).toUTCString();
      if (res.setHeader) {
        const r = res.setHeader('Set-Cookie',
          ['access_token =; Expires = \${ time0m } ',
          'refresh_token =; Expires = \${ time0m } ']);
      } else if (res.cookie) {
        res.clearCookie(def.ACCESS_TOKEN);
        res.clearCookie(def.REFRESH_TOKEN);
      }
    }
  }
}

const goodToken = async (req = null, res = null) => {
  try {
    let token;
    if (req === null) {
      token = Cookies.get();
    } else {
      token = req.cookies;
    }
    const { access_token, refresh_token } = token;
    if (!refresh_token) {
      return false;
    }
    let expired = true;
    if (access_token) {
      expired = Date.now >= (jwtDecode(access_token).exp * 1000);
    }
    if (expired) {
      let response;
      if (req === null) {
        response = await fetch(def.GRAPHQL_URL, { ...def.FETCH_API_DEFAULT, body: JSON.stringify({ query: accessToken }) });
      } else {
        let strCookie;
        if (req.headers.get) {
          strCookie = req.headers.get('cookie');
        } else {
          strCookie = req.headers.cookie;
        }
        const objCookie = strCookie.split('; ').reduce((prev, current) => {
          const [name, ...value] = current.split('=');
          prev[name] = value.join('=');
          return prev;
        }, {});
        response = await fetch(def.GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            "Authorization": 'Bearer \${ objCookie.refresh_token } ',
            "Cookie": strCookie
          }
          , body: JSON.stringify({ query: accessToken })
        });
      }
      await cookiesFromHead(response, res);
      const data = await response.json();
      if (data?.data?.generateAccessToken) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  } catch (error) {
    //todo
    res?.cookie('access_token', '')
    res?.cookie('refresh_token', '')
    return false;
  }
}

export default goodToken;
`;

/**
 * @param  {string} string => 
 * {small:"name",big:"NAME",mid:"Name"}
 */
const stringTrans = (string) => {
  return {
    small: string.toLowerCase(),
    big: string.toUpperCase(),
    mid: string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }
}

const readFile = (filename, directory = __dirname) => {
  return fs.readFileSync(path.join(directory, filename), 'utf-8', (err, data) => data)
}

const readFilesInDir = (storePath) => {
  return fs.readdirSync(storePath, { withFileTypes: true })
    .filter(item => !item.isDirectory())
    .map(item => path.parse(item.name).name);
}


const generateReduxImport = (name, filesArray, del = false) => {
  let importData = ``;
  let objData = ``;
  for (let i = 0; i < filesArray.length; i++) {
    const data = filesArray[i];
    importData += `import ${data}Data from './reducers/${data}';
`;
    objData += `  ${data}Data,
  `;
  }
  if (!del) {

    importData += `import ${name}Data from './reducers/${name}';
`;
    objData += `  ${name}Data, `;
  }

  return {
    imports: importData,
    objects: objData
  };
}

const createEnumString = (name) => {
  return `
  ${name}_DATA_REQUEST: "${name}_DATA_REQUEST",
  ${name}_DATA_SUCCESS: "${name}_DATA_SUCCESS",
  RESET_${name}_DATA: "RESET_${name}_DATA",
  ${name}_DATA_FAILURE: "${name}_DATA_FAILURE", `;
}

const deleteSelector = (name = '', storePath) => {
  name = name.toLowerCase();
  if (!pathExist(`${storePath}/store/actions/${name}.js`)) {
    return console.error(`
\x1b[31m%c"${name}" %cdoes not exist in path ${storePath}/store/actions
%c"${name}" %cdoes not exist in path ${storePath}/store/reducers
  `, 'color: red', 'color: inherit', 'color: red', 'color: inherit');
  } else {
    console.error(`
  %c...deleting ${name} %cfrom selectors`, 'color: red', 'color:inherit');
    fs.unlinkSync(`${storePath}/store/actions/${name}.js`);
    fs.unlinkSync(`${storePath}/store/reducers/${name}.js`);
    console.log(` \x1b[32m %csuccessfully deleted ${name} in ${storePath}/store/actions/
  %csuccessfully deleted ${name} in ${storePath}/store/reducers/
   `, 'color:green', 'color:green');
    const files = readFilesInDir(`${storePath}/store/actions`);
    const index = files.indexOf("index");
    if (index > -1) {
      files.splice(index, 1);
    }
    const reduxIndexData = generateReduxImport(name, files, true);
    fs.writeFile(`${storePath}/store/index.js`,
      storeIndexPathOne('react') + reduxIndexData.imports + storeIndexPathTwo('react') + reduxIndexData.objects + storeIndexPathThree('react')
      , () => { })
    handleEnum(name, storePath, true);
  }
}

const generateSelector = (name = '', storePath) => {
  name = name.toLowerCase();
  let files;
  try {
    files = readFilesInDir(`${storePath}/store/actions`);
  } catch (error) {
    console.error('\x1b[31m' + error.message)
    console.log("\x1b[32m%c...creating directory", 'color:green')
    generateReduxFolder(storePath);
    files = readFilesInDir(`${storePath}/store/actions`);
  }
  const index = files.indexOf("index");
  if (index > -1) {
    files.splice(index, 1);
  }

  if (files.includes(name)) {
    return console.error(`
  \x1b[31m This selector aready exist, please try using another name
  `)
  }

  const reduxIndexData = generateReduxImport(name, files);

  fs.writeFile(`${storePath}/store/actions/${name}.js`,
    actionSample(name)
    , () => { })

  fs.writeFile(`${storePath}/store/reducers/${name}.js`,
    reducerSample(name)
    , () => { });

  fs.writeFile(`${storePath}/store/index.js`,
    storeIndexPathOne('react') + reduxIndexData.imports + storeIndexPathTwo('react') + reduxIndexData.objects + storeIndexPathThree('react')
    , () => { })

  handleEnum(name, storePath);
  console.log(` \x1b[32m%c...adding enum to ${storePath}/services/enum.js`, 'color: green')
  console.log(`  %successfully created action and reducer for ${name}
  `, 'color:green')
}

const handleEnum = (name, storePath, del = false) => {
  name = name.toUpperCase();
  const enumString = createEnumString(name);
  let enums = '';
  let stringArr;
  if (pathExist(`${storePath}/services/enum.js`)) {
    if (!del) {
      stringArr = readFile("enum.js", './src/services').split("({");
      enums = stringArr[0] + '({' + enumString + stringArr[1];
    } else {
      stringArr = readFile("enum.js", './src/services').split(enumString);
      enums = stringArr[0] + stringArr[1];
    }
  } else {
    fs.mkdirSync(`${storePath}/services`);
    enums = `import { getAccessToken, getRefreshToken } from "./token";

const def = Object.freeze({${!del && enumString}
});
export default def;`;
  }

  fs.writeFile(`${storePath}/services/enum.js`,
    enums
    , () => { })

  if (del) {
    console.log(` \x1b[32m%c...deleting ${name.toLowerCase()} from enum
  %csuccessfully deleted ${name.toLowerCase()} from enum
  `, 'color:red', 'color:green')
  } else {
    console.log(`
  %ccreated enum for ${name.toLowerCase()}`, 'color:green')
  }
}


const createUtilFunctions = () => {
  const filePath = './src/services';
  if (!pathExist(filePath)) {
    fs.mkdirSync(filePath);
  }
  if (!pathExist(filePath + '/token.js')) {
    fs.writeFile(filePath + '/token.js', tokenFile, () => { })
    console.log(`\x1b[32m%ccreated token.js file in ./src/services`, 'color:green')
  } else {
    console.log(`\x1b[31m %ctoken.js \x1b[0m  aleady exist in ./src/services`, 'color:red')
  }
  if (!pathExist(filePath + '/form.js')) {
    fs.writeFile(filePath + '/form.js', formFile, () => { })
    console.log(`\x1b[32m%ccreated form.js file in ./src/services`, 'color:green')
  } else {
    console.log(`\x1b[31m %cform.js  \x1b[0m aleady exist in ./src/services`, 'color:red')
  }
  if (!pathExist(filePath + '/objCheck.js')) {
    fs.writeFile(filePath + '/objCheck.js', objFile, () => { })
    console.log(`\x1b[32m%ccreated objCheck.js file in ./src/services`, 'color:green')
  } else {
    console.log(`\x1b[31m %cobjCheck.js \x1b[0m  aleady exist in ./src/services`, 'color:red')
  }
  if (!pathExist(filePath + '/enum.js')) {
    fs.writeFile(filePath + '/enum.js', enumFile, () => { })
    console.log(`\x1b[32m%ccreated enum.js file in ./src/services \x1b[0m`, 'color:green')
  } else {
    console.log(`\x1b[31m %cenum.js \x1b[0m  aleady exist in ./src/services`, 'color:red')
  }
  if (!pathExist(filePath + '/axios.js')) {
    fs.writeFile(filePath + '/axios.js', axiosFile, () => { })
    console.log(`\x1b[32m%ccreated axios.js file in ./src/services \x1b[0m`, 'color:green')
  } else {
    console.log(`\x1b[31m %caxios.js \x1b[0m  aleady exist in ./src/services`, 'color:red')
  }
  if (!pathExist(filePath + '/axiosAuth.js')) {
    fs.writeFile(filePath + '/axiosAuth.js', axiosAuthFile, () => { })
    console.log(`\x1b[32m%ccreated axiosAuth.js file in ./src/services \x1b[0m`, 'color:green')
  } else {
    console.log(`\x1b[31m %caxiosAuth.js \x1b[0m  aleady exist in ./src/services`, 'color:red')
  }

}

const generateRouteFile = (rootPath, file) => {
  const filePath = `${rootPath}/${file.includes('.js') ? file : file + '.js'}`;
  if (!pathExist(rootPath)) {
    fs.mkdirSync(rootPath);
  }
  if (!pathExist('./src/pages')) {
    fs.mkdirSync('./src/pages');
  }

  if (pathExist(filePath)) {
    return console.error(`
  \x1b[31mfile already exist in: ${filePath}
  `);
  }

  if (!pathExist('./src/pages/index.js')) {
    fs.writeFile('./src/pages/index.js',
      `
import React from 'react';

function Index(){
  return <>Hello World</>
}

export default Index;
`
      , () => { })
  }

  // return
  let dot = '../'.repeat(rootPath.split('/').length - 2);
  fs.writeFile(filePath,
    routing(file.replace('.js', ''), dot ? dot : './')
    , () => { })
  console.log(`
  \x1b[32m %csuccessfully \x1b[0mcreated store in ${rootPath}
 `, 'color:green');
}

const generateReduxFolder = (rootPath, type) => {
  const storePath = `${rootPath}/store`;
  if (!pathExist(storePath)) {
    fs.mkdirSync(storePath);
  } else {
    return console.error(`
  \x1b[31mstore already exist in path ${rootPath}
  `);
  }

  if (!pathExist(`${storePath}/graphql`)) {
    fs.mkdirSync(`${storePath}/graphql`);
    if (!pathExist(`${storePath}/graphql/onboarding.js`)) {
      fs.writeFile(`${storePath}/graphql/onboarding.js`,
        onboardingFile
        , () => { })
    }
  }
  if (!pathExist(`${storePath}/index.js`)) {
    fs.writeFile(`${storePath}/index.js`,
      storeIndexPathOne(type) + storeIndexPathTwo() + storeIndexPathThree(type)
      , () => { })
  }
  if (!pathExist(`${storePath}/actions`)) {
    fs.mkdirSync(`${storePath}/actions`);
  }
  if (!pathExist(`${storePath}/reducers`)) {
    fs.mkdirSync(`${storePath}/reducers`);
  }
  console.log(`
  \x1b[32m %csuccessfully created store in ${rootPath}
 `, 'color:green');
}
const pathExist = (filename) => fs.existsSync(path.join(__dirname, filename));

const handleReduxInFIle = (dirBreak, name, server = "", form = "") => {
  const rootPath = dirBreak;
  dirBreak = dirBreak.split("/");
  const file = dirBreak[dirBreak.length - 1];
  let filename;
  if (path.parse(file).name === 'index') {
    filename = stringTrans(dirBreak[dirBreak.length - 2])
  } else {
    filename = stringTrans(path.parse(file).name);
  }
  const folderDir = dirBreak.slice(0, -1).join('/');
  dirBreak.shift();
  const pageDistance = dirBreak.indexOf("pages");
  let pathDistance = dirBreak.length - 1 - pageDistance;
  let distanceString = '../'.repeat(pathDistance);
  name = stringTrans(name);

  if (pathExist(rootPath)) {
    return console.error(`
  \x1b[31m ${file} already exist at ${folderDir}/
   `)
  }
  if (!pathExist(folderDir)) {
    console.log(`
\x1b[32m%c...creating directory ${folderDir}
          `, 'color:green')
    fs.mkdirSync(folderDir);
  }
  if (form) {
    form = jsxBoilerPlateForm(name, form.split(','))
  }
  if (server) {
    server = jsxBoilerPlateServer();
  }
  fs.writeFile(rootPath,
    jsxBoilerPlateImport(name, distanceString, server) +
    jsxBoilerPlateHooks(name, filename) +
    jsxBoilerPlateUseEffect(name) +
    form +
    jsxBoilerPlateRender(filename) +
    server +
    jsxBoilerPlateExport(filename)
    , () => { })
  console.log(`\x1b[32m redux boiler plate creation complete
  directory ${rootPath}
      `)

}


program.command("include")
  .argument('<name>', 'name of selector to include in file')
  .option('--server', 'include server function and import')
  .option('-f, --form <FieldList>', 'comma seperated form fields')
  .option('-p, --path <RootDirectory>', 'full path to react file, default is ./src/pages/index.jsx')
  .action((name, options) => {
    const pathDir = options.path ? options.path : './src/pages/index.jsx';
    handleReduxInFIle(pathDir, name, options.server, options.form)
  })

program.command('delete')
  .option('-s, --selector <name>', 'delete actions, reducer and enum of selector in store')
  .option('-p, --path <RootDirectory>', 'root directory to store, default is ./src')
  .action((options) => {
    const pathDir = options.path ? options.path : './src';
    if (options.selector) {
      deleteSelector(options.selector, pathDir)
    } else {
      console.log(`
  node <command_file> delete -h    for quick help on <command_file>    
      `)
    }
  });

program.command('create')
  .description('autogenerate redux boilerplate files')
  .option('--service', 'create custom utility functions')
  .option('--route [file]', 'create  routing & store file boilerplate')
  .option('--store [type]', 'create redux store boilerplate')
  .option('-s, --selector <name>', 'create actions and reducer files and update enum.js')
  .option('-p, --path <RootDirectory>', 'root directory to store, default is ./src')
  .action((options) => {
    const pathDir = options.path ? options.path : './src';
    if (options.store) {
      let type;
      if (options.store === true || options.store == 'react') {
        type = 'react';
      } else if (options.store == 'nextjs') {
        type = 'nextjs';
      } else {
        return console.error('\x1b[31m error: store type must be "react|nextjs"');
      }
      generateReduxFolder(pathDir, type);
    }
    if (options.service) {
      createUtilFunctions();
    }
    if (options.route) {
      generateRouteFile(pathDir, options.route === true ? 'App' : options.route)
    }
    if (options.selector) {
      generateSelector(options.selector, pathDir);
    }
    if (!options.store && !options.selector) {
      console.log(`
  node <command_file> create -h    for quick help on <command_file>    
      `)
    }
  });
program.version('0.0.1', '-v, --version', 'output the current version');
program.parse(); 