'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Group from './components/group';
import _ from 'lodash';

class Main extends React.Component {

	render() {

		const groups = this.form.groups.map((group, idx) => (
			<Group key={ idx } group={ group } preferences={ this.preferences[this.section.id] } onFieldChange={ this.onFieldChange.bind(this) } />
		));

		return (
			<div className="main" role="tabpanel">
				{ groups }
			</div>
		);

	}

	get sections() {

		return this.props.sections;

	}

	get form() {

		return this.section.form;

	}

	get preferences() {

		return this.props.preferences;

	}

	get activeSection() {

		return this.props.activeSection;

	}

	get section() {

		return _.find(this.sections, {
			id: this.activeSection,
		});

	}

	get onFieldChange() {

		return this.props.onFieldChange;

	}

}

Main.propTypes = {
	sections: PropTypes.array,
	preferences: PropTypes.object,
	activeSection: PropTypes.string,
	onFieldChange: PropTypes.func,
};

export default Main;
