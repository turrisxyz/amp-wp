/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { numberFormat } from '../../../utils/number-format';
import FormattedMemoryValue from '../../../components/formatted-memory-value';
import { ValidationStatusIcon } from '../../../components/icon';
import {
	AMPNotice,
	NOTICE_SIZE_LARGE,
	NOTICE_TYPE_WARNING,
	NOTICE_TYPE_ERROR,
} from '../../../components/amp-notice';
import {
	STYLESHEETS_BUDGET_STATUS_VALID,
	STYLESHEETS_BUDGET_STATUS_WARNING,
	STYLESHEETS_BUDGET_STATUS_EXCEEDED,
} from '../../helpers';

/**
 * Render stylesheets summary table.
 *
 * @param {Object} props Component props.
 * @param {number} props.cssBudgetBytes CSS budget value in bytes.
 * @param {Object} props.stylesheetSizes Stylesheet sizes object.
 */
export default function StylesheetsSummary( { cssBudgetBytes, stylesheetSizes } ) {
	return (
		<>
			<table className="amp-stylesheet-summary">
				<tbody>
					<tr>
						<th>
							{ __( 'Total CSS size prior to minification:', 'amp' ) }
						</th>
						<td>
							<FormattedMemoryValue value={ stylesheetSizes.included.originalSize } unit="B" />
						</td>
					</tr>
					<tr>
						<th>
							{ __( 'Total CSS size after minification:', 'amp' ) }
						</th>
						<td>
							<FormattedMemoryValue value={ stylesheetSizes.included.finalSize } unit="B" />
						</td>
					</tr>
					<tr>
						<th>
							{ __( 'Percentage of used CSS budget', 'amp' ) }
							{ cssBudgetBytes && [ ' (', <FormattedMemoryValue value={ cssBudgetBytes / 1000 } unit="kB" key="" />, ')' ] }
							{ ':' }
						</th>
						<td>
							{ `${ numberFormat( parseFloat( stylesheetSizes.budget.usage ).toFixed( 1 ) ) }%` }
							{ ' ' }
							{ stylesheetSizes.budget.status === STYLESHEETS_BUDGET_STATUS_EXCEEDED && (
								<ValidationStatusIcon isError isBoxed />
							) }
							{ stylesheetSizes.budget.status === STYLESHEETS_BUDGET_STATUS_WARNING && (
								<ValidationStatusIcon isWarning isBoxed />
							) }
							{ stylesheetSizes.budget.status === STYLESHEETS_BUDGET_STATUS_VALID && (
								<ValidationStatusIcon isValid isBoxed />
							) }
						</td>
					</tr>
					<tr>
						<th>
							{ sprintf(
								// translators: %d stands for the number of stylesheets
								__( 'Excluded minified CSS size (%d stylesheets):', 'amp' ),
								stylesheetSizes.excluded.stylesheets.length,
							) }
						</th>
						<td>
							<FormattedMemoryValue value={ stylesheetSizes.excluded.finalSize } unit="B" />
						</td>
					</tr>
				</tbody>
			</table>
			{ stylesheetSizes.budget.status === STYLESHEETS_BUDGET_STATUS_WARNING && (
				<AMPNotice size={ NOTICE_SIZE_LARGE } type={ NOTICE_TYPE_WARNING }>
					{ __( 'You are nearing the limit of the CSS budget. Once this limit is reached, stylesheets deemed of lesser priority will be excluded from the page. Please review the stylesheets below and determine if the current theme or a particular plugin is including excessive CSS.', 'amp' ) }
				</AMPNotice>
			) }
			{ stylesheetSizes.budget.status === STYLESHEETS_BUDGET_STATUS_EXCEEDED && (
				<AMPNotice size={ NOTICE_SIZE_LARGE } type={ NOTICE_TYPE_ERROR }>
					{ __( 'You have exceeded the CSS budget. Stylesheets deemed of lesser priority have been excluded from the page. Please review the flagged stylesheets below and determine if the current theme or a particular plugin is including excessive CSS.', 'amp' ) }
				</AMPNotice>
			) }
		</>
	);
}
StylesheetsSummary.propTypes = {
	cssBudgetBytes: PropTypes.number,
	stylesheetSizes: PropTypes.shape( {
		included: PropTypes.shape( {
			originalSize: PropTypes.number,
			finalSize: PropTypes.number,
			stylesheets: PropTypes.arrayOf( PropTypes.string ),
		} ),
		excessive: PropTypes.shape( {
			stylesheets: PropTypes.arrayOf( PropTypes.string ),
		} ),
		excluded: PropTypes.shape( {
			originalSize: PropTypes.number,
			finalSize: PropTypes.number,
			stylesheets: PropTypes.arrayOf( PropTypes.string ),
		} ),
		budget: PropTypes.shape( {
			usage: PropTypes.number,
			status: PropTypes.oneOf( [
				STYLESHEETS_BUDGET_STATUS_VALID,
				STYLESHEETS_BUDGET_STATUS_WARNING,
				STYLESHEETS_BUDGET_STATUS_EXCEEDED,
			] ),
		} ),
	} ),
};
