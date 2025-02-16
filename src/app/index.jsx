/* global api, document */

/* Eleectron Renderer Process */
"use strict";

import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import debounce from "./utils/debounce";
import Sidebar from "./components/sidebar";
import Main from "./components/main";
import "../../scss/style.scss";
import Spinner from "./components/main/spinner";

const allSections = api.getSections();
const preferences = api.getPreferences();

const sections = allSections.filter((section) =>
  _.isBoolean(section.enabled) ? section.enabled : true
);

const dSavePreferences = debounce((key, preferences) => {
  api.setPreferences(key, preferences);
}, 200);

sections.forEach((section) => {
  if (!preferences[section.id]) {
    preferences[section.id] = {};
  }
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sections,
      activeSection: sections[0].id,
      preferences,
      loading: false,
    };
  }

  componentDidMount() {
    const setLoading = (isLoading) => {
      this.setState({
        loading: isLoading,
      });
    };

    api.ipcRenderer.on("isLoading", setLoading);
  }

  render() {
    return (
      <React.Fragment>
        <Sidebar
          {...this.state}
          onSelectSection={this.onSelectSection.bind(this)}
        />
        <Main {...this.state} onFieldChange={this.onFieldChange.bind(this)} />
        {this.state.loading && <Spinner />}
      </React.Fragment>
    );
  }

  onSelectSection(sectionId) {
    this.setState({
      activeSection: sectionId,
    });
  }

  onFieldChange(key, value) {
    preferences[this.state.activeSection][key] = value;

    this.setState({
      preferences,
    });
    dSavePreferences(key, preferences);
  }
}

ReactDOM.render(<App />, document.getElementById("window"));
