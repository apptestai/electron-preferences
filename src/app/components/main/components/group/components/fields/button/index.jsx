'use strict';

import PropTypes from 'prop-types';
import React from 'react';

class ButtonField extends React.Component {
  render() {
    console.log('button');
    return (
      <div className="field field-button">
        <input
          type="button"
          onClick={this.onClick.bind(this)}
          value={this.label}
          aria-label={this.label}
        />
        {this.help && <span className="help">{this.help}</span>}
      </div>
    );
  }

  get field() {
    return this.props.field;
  }

  get value() {
    return this.field.label;
  }

  get label() {
    return this.field.label;
  }

  get help() {
    return this.field.help;
  }

  onClick() {
    return this.props.onChange(true);
  }
}

ButtonField.propTypes = {
  field: PropTypes.object,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default ButtonField;
