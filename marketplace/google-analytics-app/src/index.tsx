import * as React from 'react';
import { render } from 'react-dom';
// import PropTypes from 'prop-types';
import {
  init,
  locations,
  AppExtensionSDK,
  SidebarExtensionSDK
} from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';
import AppConfig from './AppConfig';

import Analytics from './Analytics';
import { SidebarExtensionState } from './typings';
import styles from './styles';

export class SidebarExtension extends React.Component<
  SidebarExtensionProps,
  SidebarExtensionState
> {
  constructor(props: SidebarExtensionProps) {
    super(props);
    const { entry, parameters } = props.sdk;
    const contentTypeId = entry.getSys().contentType.sys.id;
    const { prefix, slugField } = parameters.installation.contentTypes[contentTypeId];
    const hasSlug = slugField in entry.fields;

    const pagePath = hasSlug
      ? `/${prefix ? `${prefix}/` : ''}${entry.fields[slugField].getValue()}/`
      : '';

    this.state = {
      isAuthorized: window.gapi.analytics.auth.isAuthorized(),
      hasSlug,
      pagePath,
      contentTypeId
    };
  }

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();
    const { auth } = window.gapi.analytics;

    auth.on('signIn', () => this.setState({ isAuthorized: true }));
    auth.on('signOut', () => this.setState({ isAuthorized: false }));
  }

  onButtonClick = () => {
    return this.props.sdk.dialogs.openExtension({
      width: 800,
      title: 'The same extension rendered in modal window'
    });
  };

  render() {
    const { isAuthorized, pagePath, hasSlug, contentTypeId } = this.state;
    const { parameters, entry } = this.props.sdk;

    if (!isAuthorized) {
      const renderAuthButton = authButton => {
        window.gapi.analytics.auth.authorize({
          container: authButton,
          clientid: this.props.sdk.parameters.installation.clientId
        });
      };

      return (
        <div ref={renderAuthButton} className={isAuthorized ? styles.hidden : styles.signInButton} />
      );
    }

    if (!hasSlug) {
      return <p>This {contentTypeId} entry doesn&apos;t have a valid slug field.</p>;
    }

    if (!entry.getSys().publishedAt) {
      return <p>This {contentTypeId} entry hasn&apos;t been published.</p>;
    }

    return (
      <section>
        <Analytics pagePath={pagePath} viewId={parameters.installation.viewId} />
      </section>
    );
  }
}

init(sdk => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    render(<AppConfig sdk={sdk as AppExtensionSDK} />, document.getElementById('root'));
  } else {
    render(<SidebarExtension sdk={sdk as SidebarExtensionSDK} />, document.getElementById('root'));
  }
});

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
