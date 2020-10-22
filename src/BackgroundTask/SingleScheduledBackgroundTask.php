<?php
/**
 * Abstract class SingleScheduledBackgroundTask.
 *
 * @package AmpProject\AmpWP
 */

namespace AmpProject\AmpWP\BackgroundTask;

use AmpProject\AmpWP\Infrastructure\Registerable;
use AmpProject\AmpWP\Infrastructure\Service;

/**
 * Abstract base class for using cron to execute a background task that runs only once.
 *
 * @package AmpProject\AmpWP
 * @since 2.0
 * @internal
 */
abstract class SingleScheduledBackgroundTask implements Service, Registerable {
	/**
	 * Class constructor.
	 *
	 * @param BackgroundTaskDeactivator $background_task_deactivator Service that deactivates background events.
	 */
	public function __construct( BackgroundTaskDeactivator $background_task_deactivator ) {
		$background_task_deactivator->add_event( $this->get_event_name() );
	}

	/**
	 * Register the service with the system.
	 *
	 * @return void
	 */
	public function register() {
		$action_hook = $this->get_action_hook();

		add_action( $action_hook, [ $this, 'schedule_event' ], 10, $this->get_action_hook_arg_count( $action_hook ) );
		add_action( $this->get_event_name(), [ $this, 'process' ] );
	}

	/**
	 * Schedule the event.
	 *
	 * This does nothing if the event is already scheduled.
	 *
	 * @param array ...$args Arguments passed to the function from the action hook.
	 * @return void
	 */
	public function schedule_event( ...$args ) {
		if ( ! $this->should_schedule_event( $args ) ) {
			return;
		}

		wp_schedule_single_event( $this->get_timestamp(), $this->get_event_name(), $args );
	}

	/**
	 * Get the interval to use for the event.
	 *
	 * @return string An existing interval name. Valid values are 'hourly', 'twicedaily' or 'daily'.
	 */
	protected function get_timestamp() {
		return time();
	}

	/**
	 * The number of args expected from the action hook. Default 1.
	 *
	 * @return int
	 */
	protected function get_action_hook_arg_count() { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return 1;
	}

	/**
	 * Returns whether the event should be scheduled.
	 *
	 * @param array $args Arguments passed from the action hook where the event is to be scheduled.
	 * @return boolean
	 */
	abstract protected function should_schedule_event( $args );

	/**
	 * Gets the hook on which to schedule the event.
	 *
	 * @return string The action hook name.
	 */
	abstract protected function get_action_hook();

	/**
	 * Get the event name.
	 *
	 * This is the "slug" of the event, not the display name.
	 *
	 * Note: the event name should be prefixed to prevent naming collisions.
	 *
	 * @return string Name of the event.
	 */
	abstract protected function get_event_name();

	/**
	 * Process a single cron tick.
	 *
	 * @param array $args The args received with the action hook where the event was scheduled.
	 */
	abstract public function process( $args );
}
