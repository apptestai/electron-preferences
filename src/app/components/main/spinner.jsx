'use strict';

import React from 'react';
import { CircularProgress } from '@material-ui/core';
import styled from 'styled-components';

class Spinner extends React.Component {

	render() {

		return (
			<Wrapper>
				<div>
					<CircularProgress size={100} />
				</div>
			</Wrapper>
		);

	}

}

export default Spinner;

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  position: fixed;
  display: flex;
  justify-content: center;
  z-index: 9999;
  background-color: rgba(255, 255, 255, 0.2);
  animation: 0.22s fadeIn;
  animation-fill-mode: forwards;

  visibility: hidden;

  div {
    margin: auto 0;
  }

  @keyframes fadeIn {
    99% {
      visibility: hidden;
    }
    100% {
      visibility: visible;
    }
  }
`;
