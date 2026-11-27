import React from 'react'
import { useFeature } from 'src/hooks/useFeatureFlags'
import { FeatureFlagKey } from 'src/store/featureFlagsStore'

/** Dos versiones de una pantalla mientras la nueva está en construcción. */
const FeatureSwitch = ({
  flag,
  on,
  off
}: {
  flag: FeatureFlagKey
  on: React.ReactElement
  off: React.ReactElement
}) => (useFeature(flag) ? on : off)

export default FeatureSwitch
